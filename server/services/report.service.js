const mongoose = require('mongoose');
const ExamResult = require('../models/ExamResult');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const StudentProfile = require('../models/StudentProfile');
const StaffProfile = require('../models/StaffProfile');
const Exam = require('../models/Exam');
const ActivityLog = require('../models/ActivityLog');
const ExamSchedule = require('../models/ExamSchedule');
const { ATTENDANCE_ELIGIBILITY_THRESHOLD } = require('../utils/constants');

async function getClassPerformance(examId, classId) {
  const results = await ExamResult.aggregate([
    { $match: { examId: new mongoose.Types.ObjectId(examId) } },
    { $lookup: { from: 'studentprofiles', localField: 'studentId', foreignField: '_id', as: 'student' } },
    { $unwind: '$student' },
    { $lookup: { from: 'enrollments', localField: 'studentId', foreignField: 'studentId', as: 'enrollment' } },
    { $unwind: '$enrollment' },
    { $match: { 'enrollment.classId': new mongoose.Types.ObjectId(classId) } },
    {
      $group: {
        _id: '$studentId',
        studentCode: { $first: '$student.studentId' },
        fullName: { $first: '$student.fullName' },
        totalObtained: { $sum: '$marksObtained' },
        totalMaximum: { $sum: '$maximumMarks' },
        failedSubjects: { $sum: { $cond: [{ $eq: ['$resultStatus', 'FAIL'] }, 1, 0] } },
      },
    },
  ]);

  const withPercentage = results
    .map((r) => ({
      ...r,
      percentage: r.totalMaximum ? Math.round((r.totalObtained / r.totalMaximum) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const classAverage = withPercentage.length
    ? Math.round((withPercentage.reduce((sum, r) => sum + r.percentage, 0) / withPercentage.length) * 10) / 10
    : 0;

  return {
    students: withPercentage,
    classAverage,
    highest: withPercentage[0]?.percentage ?? 0,
    lowest: withPercentage[withPercentage.length - 1]?.percentage ?? 0,
    passCount: withPercentage.filter((r) => r.failedSubjects === 0).length,
    failCount: withPercentage.filter((r) => r.failedSubjects > 0).length,
  };
}

async function getSubjectPerformance(examId) {
  const rows = await ExamResult.aggregate([
    { $match: { examId: new mongoose.Types.ObjectId(examId) } },
    {
      $group: {
        _id: '$subjectId',
        average: { $avg: '$marksObtained' },
        highest: { $max: '$marksObtained' },
        lowest: { $min: '$marksObtained' },
        total: { $sum: 1 },
        passed: { $sum: { $cond: [{ $eq: ['$resultStatus', 'PASS'] }, 1, 0] } },
      },
    },
    { $lookup: { from: 'subjects', localField: '_id', foreignField: '_id', as: 'subject' } },
    { $unwind: '$subject' },
  ]);

  return rows.map((r) => ({
    subjectId: r._id,
    subjectName: r.subject.subjectName,
    average: Math.round(r.average * 10) / 10,
    highest: r.highest,
    lowest: r.lowest,
    passPercentage: r.total ? Math.round((r.passed / r.total) * 1000) / 10 : 0,
  }));
}

// Transparent rule-based flagging (spec section 43) - no ML: attendance below
// threshold, OR overall average below 40%, OR 2+ failed subjects on their
// most recent exam.
async function getNeedsAttention() {
  const attendanceRows = await Attendance.aggregate([
    {
      $group: {
        _id: '$studentId',
        conducted: { $sum: 1 },
        attended: { $sum: { $cond: [{ $in: ['$status', ['PRESENT', 'LATE']] }, 1, 0] } },
      },
    },
  ]);
  const attendanceByStudent = new Map(
    attendanceRows.map((r) => [
      r._id.toString(),
      r.conducted ? (r.attended / r.conducted) * 100 : 100,
    ])
  );

  const latestExam = await ExamResult.findOne().sort({ createdAt: -1 });
  let marksByStudent = new Map();
  if (latestExam) {
    const marksRows = await ExamResult.aggregate([
      { $match: { examId: latestExam.examId } },
      {
        $group: {
          _id: '$studentId',
          totalObtained: { $sum: '$marksObtained' },
          totalMaximum: { $sum: '$maximumMarks' },
          failedSubjects: { $sum: { $cond: [{ $eq: ['$resultStatus', 'FAIL'] }, 1, 0] } },
        },
      },
    ]);
    marksByStudent = new Map(
      marksRows.map((r) => [
        r._id.toString(),
        {
          average: r.totalMaximum ? (r.totalObtained / r.totalMaximum) * 100 : 0,
          failedSubjects: r.failedSubjects,
        },
      ])
    );
  }

  const studentIds = new Set([...attendanceByStudent.keys(), ...marksByStudent.keys()]);
  const enrollments = await Enrollment.find({ studentId: { $in: [...studentIds] }, status: 'ACTIVE' }).populate(
    'studentId',
    'studentId fullName'
  );

  const flagged = [];
  for (const enrollment of enrollments) {
    const id = enrollment.studentId._id.toString();
    const attendancePct = attendanceByStudent.get(id);
    const marks = marksByStudent.get(id);

    const reasons = [];
    if (attendancePct !== undefined && attendancePct < ATTENDANCE_ELIGIBILITY_THRESHOLD) {
      reasons.push(`Attendance ${Math.round(attendancePct)}%`);
    }
    if (marks && marks.average < 40) {
      reasons.push(`Average marks ${Math.round(marks.average)}%`);
    }
    if (marks && marks.failedSubjects >= 2) {
      reasons.push(`${marks.failedSubjects} failed subjects`);
    }

    if (reasons.length) {
      flagged.push({
        studentId: id,
        studentCode: enrollment.studentId.studentId,
        fullName: enrollment.studentId.fullName,
        reasons,
      });
    }
  }

  return flagged;
}

async function countsByField(Model, field, filter = {}) {
  const rows = await Model.aggregate([{ $match: filter }, { $group: { _id: `$${field}`, count: { $sum: 1 } } }]);
  return rows.map((r) => ({ status: r._id, count: r.count }));
}

async function getStudentsByClass() {
  const rows = await Enrollment.aggregate([
    { $match: { status: 'ACTIVE' } },
    { $group: { _id: '$classId', count: { $sum: 1 } } },
    { $lookup: { from: 'classes', localField: '_id', foreignField: '_id', as: 'class' } },
    { $unwind: '$class' },
    { $sort: { 'class.className': 1 } },
  ]);
  return rows.map((r) => ({ className: r.class.className, count: r.count }));
}

async function getAttendanceTrend() {
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const rows = await Attendance.aggregate([
    { $match: { date: { $gte: since } } },
    {
      $group: {
        _id: '$date',
        total: { $sum: 1 },
        attended: { $sum: { $cond: [{ $in: ['$status', ['PRESENT', 'LATE']] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return rows.map((r) => ({
    date: r._id,
    percentage: r.total ? Math.round((r.attended / r.total) * 1000) / 10 : 0,
  }));
}

// "Latest" means the completed/locked exam with the most entered results, not
// the one with the furthest-future end date - a freshly-created exam with a
// single test result would otherwise outrank a fully-graded real exam.
async function getLatestExamPassFail() {
  const completedExamIds = await Exam.find({ status: { $in: ['COMPLETED', 'LOCKED'] } }).distinct('_id');
  if (!completedExamIds.length) return null;

  const rows = await ExamResult.aggregate([
    { $match: { examId: { $in: completedExamIds } } },
    {
      $group: {
        _id: '$examId',
        total: { $sum: 1 },
        pass: { $sum: { $cond: [{ $eq: ['$resultStatus', 'PASS'] }, 1, 0] } },
        fail: { $sum: { $cond: [{ $eq: ['$resultStatus', 'FAIL'] }, 1, 0] } },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 1 },
    { $lookup: { from: 'exams', localField: '_id', foreignField: '_id', as: 'exam' } },
    { $unwind: '$exam' },
  ]);

  if (!rows.length) return null;
  return { examName: rows[0].exam.examName, pass: rows[0].pass, fail: rows[0].fail };
}

async function getDashboardSummary() {
  const [
    attendanceStatusCounts,
    genderDistribution,
    staffByDepartment,
    studentsByClass,
    attendanceTrend,
    latestExamPassFail,
    needsAttention,
    recentActivity,
    upcomingExamSchedules,
  ] = await Promise.all([
    countsByField(Attendance, 'status'),
    countsByField(StudentProfile, 'gender', { gender: { $ne: null } }),
    countsByField(StaffProfile, 'department', { department: { $ne: null } }),
    getStudentsByClass(),
    getAttendanceTrend(),
    getLatestExamPassFail(),
    getNeedsAttention(),
    ActivityLog.find().populate('userId', 'loginId role').sort({ createdAt: -1 }).limit(6),
    ExamSchedule.find({ examDate: { $gte: new Date() } })
      .populate('examId', 'examName status')
      .populate('subjectId', 'subjectName')
      .populate('classId', 'className')
      .sort({ examDate: 1 })
      .limit(6),
  ]);

  return {
    attendanceStatusCounts,
    genderDistribution,
    staffByDepartment,
    studentsByClass,
    attendanceTrend,
    latestExamPassFail,
    needsAttentionCount: needsAttention.length,
    recentActivity,
    upcomingExamSchedules,
  };
}

module.exports = { getClassPerformance, getSubjectPerformance, getNeedsAttention, getDashboardSummary };
