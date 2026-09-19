const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Enrollment = require('../models/Enrollment');
const StaffProfile = require('../models/StaffProfile');
const StudentProfile = require('../models/StudentProfile');
const TeacherAssignment = require('../models/TeacherAssignment');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('../utils/activityLogger');
const { ATTENDANCE_ELIGIBILITY_THRESHOLD } = require('../utils/constants');

// Present, Late and On Duty (authorized absence for an official college activity)
// all count as attended; Excused/Absent do not, but every held class still counts
// toward "classes conducted" - matches the spec's plain (attended / conducted)
// formula without silently forgiving excused misses.
const ATTENDED_STATUSES = ['PRESENT', 'LATE', 'ON_DUTY'];

async function assertStaffAssigned(actingUser, { academicYearId, classId, sectionId, subjectId }) {
  if (actingUser.role === 'ADMIN') return;

  const staffProfile = await StaffProfile.findOne({ userId: actingUser._id });
  if (!staffProfile) {
    throw new ApiError(403, 'No staff profile linked to this account');
  }

  const assignment = await TeacherAssignment.findOne({
    staffId: staffProfile._id,
    academicYearId,
    classId,
    sectionId,
    subjectId,
  });

  if (!assignment) {
    throw new ApiError(403, 'You are not assigned to this class/section/subject');
  }
}

async function getRoster({ classId, sectionId, academicYearId, subjectId, date }) {
  const enrollments = await Enrollment.find({ classId, sectionId, academicYearId, status: 'ACTIVE' })
    .populate('studentId', 'studentId fullName')
    .sort({ rollNumber: 1 });

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const existing = await Attendance.find({
    subjectId,
    date: { $gte: dayStart, $lt: dayEnd },
    studentId: { $in: enrollments.map((e) => e.studentId._id) },
  });
  const existingByStudent = new Map(existing.map((a) => [a.studentId.toString(), a]));

  return enrollments.map((e) => ({
    studentId: e.studentId._id,
    studentCode: e.studentId.studentId,
    fullName: e.studentId.fullName,
    rollNumber: e.rollNumber,
    status: existingByStudent.get(e.studentId._id.toString())?.status || null,
    remarks: existingByStudent.get(e.studentId._id.toString())?.remarks || null,
  }));
}

async function markAttendance(payload, actingUser, req) {
  await assertStaffAssigned(actingUser, payload);

  const dayStart = new Date(payload.date);
  dayStart.setHours(0, 0, 0, 0);

  const results = await Promise.all(
    payload.records.map((record) =>
      Attendance.findOneAndUpdate(
        { studentId: record.studentId, subjectId: payload.subjectId, date: dayStart },
        {
          $set: {
            academicYearId: payload.academicYearId,
            classId: payload.classId,
            sectionId: payload.sectionId,
            status: record.status,
            remarks: record.remarks || null,
            markedBy: actingUser._id,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );

  await logActivity({
    user: actingUser,
    action: 'ATTENDANCE_MARKED',
    entityType: 'Attendance',
    entityId: `${payload.classId}:${payload.sectionId}:${payload.subjectId}:${dayStart.toISOString().slice(0, 10)}`,
    description: `Marked attendance for ${results.length} student(s)`,
    req,
  });

  return results;
}

async function getStudentSummary(studentProfileId, query = {}) {
  const match = { studentId: new mongoose.Types.ObjectId(studentProfileId) };
  if (query.academicYearId) match.academicYearId = new mongoose.Types.ObjectId(query.academicYearId);

  const rows = await Attendance.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$subjectId',
        conducted: { $sum: 1 },
        attended: { $sum: { $cond: [{ $in: ['$status', ATTENDED_STATUSES] }, 1, 0] } },
      },
    },
    { $lookup: { from: 'subjects', localField: '_id', foreignField: '_id', as: 'subject' } },
    { $unwind: '$subject' },
  ]);

  return rows.map((r) => {
    const percentage = r.conducted ? Math.round((r.attended / r.conducted) * 1000) / 10 : 0;
    return {
      subjectId: r._id,
      subjectName: r.subject.subjectName,
      subjectCode: r.subject.subjectCode,
      classesConducted: r.conducted,
      classesAttended: r.attended,
      percentage,
      eligible: percentage >= ATTENDANCE_ELIGIBILITY_THRESHOLD,
    };
  });
}

async function getShortageList(query) {
  const match = {};
  if (query.classId) match.classId = new mongoose.Types.ObjectId(query.classId);
  if (query.sectionId) match.sectionId = new mongoose.Types.ObjectId(query.sectionId);
  if (query.academicYearId) match.academicYearId = new mongoose.Types.ObjectId(query.academicYearId);

  const rows = await Attendance.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$studentId',
        conducted: { $sum: 1 },
        attended: { $sum: { $cond: [{ $in: ['$status', ATTENDED_STATUSES] }, 1, 0] } },
      },
    },
    { $lookup: { from: 'studentprofiles', localField: '_id', foreignField: '_id', as: 'student' } },
    { $unwind: '$student' },
  ]);

  return rows
    .map((r) => ({
      studentId: r._id,
      studentCode: r.student.studentId,
      fullName: r.student.fullName,
      classesConducted: r.conducted,
      classesAttended: r.attended,
      percentage: r.conducted ? Math.round((r.attended / r.conducted) * 1000) / 10 : 0,
    }))
    .filter((r) => r.percentage < ATTENDANCE_ELIGIBILITY_THRESHOLD)
    .sort((a, b) => a.percentage - b.percentage);
}

async function getStudentDaily(studentProfileId, query = {}) {
  const match = { studentId: new mongoose.Types.ObjectId(studentProfileId) };
  if (query.from || query.to) {
    match.date = {};
    if (query.from) match.date.$gte = new Date(query.from);
    if (query.to) {
      const end = new Date(query.to);
      end.setHours(23, 59, 59, 999);
      match.date.$lte = end;
    }
  }

  const rows = await Attendance.find(match).populate('subjectId', 'subjectName subjectCode').sort({ date: 1 });

  return rows.map((r) => ({
    date: r.date,
    subjectId: r.subjectId._id,
    subjectName: r.subjectId.subjectName,
    subjectCode: r.subjectId.subjectCode,
    status: r.status,
    remarks: r.remarks,
  }));
}

async function resolveStudentProfileForUser(userId) {
  return StudentProfile.findOne({ userId });
}

module.exports = {
  getRoster,
  markAttendance,
  getStudentSummary,
  getStudentDaily,
  getShortageList,
  resolveStudentProfileForUser,
};
