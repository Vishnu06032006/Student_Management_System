const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const ExamSchedule = require('../models/ExamSchedule');
const ExamResult = require('../models/ExamResult');
const Enrollment = require('../models/Enrollment');
const StaffProfile = require('../models/StaffProfile');
const StudentProfile = require('../models/StudentProfile');
const TeacherAssignment = require('../models/TeacherAssignment');
const ApiError = require('../utils/ApiError');
const { calculateGrade } = require('../utils/grading');
const { logActivity } = require('../utils/activityLogger');

async function assertStaffAssigned(actingUser, exam, { classId, subjectId }) {
  if (actingUser.role === 'ADMIN') return;

  const staffProfile = await StaffProfile.findOne({ userId: actingUser._id });
  if (!staffProfile) {
    throw new ApiError(403, 'No staff profile linked to this account');
  }

  const assignment = await TeacherAssignment.findOne({
    staffId: staffProfile._id,
    academicYearId: exam.academicYearId,
    classId,
    subjectId,
  });

  if (!assignment) {
    throw new ApiError(403, 'You are not assigned to teach this subject for this class');
  }
}

async function getRoster(examId, subjectId) {
  const schedule = await ExamSchedule.findOne({ examId, subjectId });
  if (!schedule) {
    throw new ApiError(404, 'No exam schedule found for this exam and subject');
  }

  const exam = await Exam.findById(examId);

  const enrollments = await Enrollment.find({
    classId: schedule.classId,
    academicYearId: exam.academicYearId,
    status: 'ACTIVE',
  })
    .populate('studentId', 'studentId fullName')
    .sort({ rollNumber: 1 });

  const existing = await ExamResult.find({ examId, subjectId });
  const existingByStudent = new Map(existing.map((r) => [r.studentId.toString(), r]));

  return {
    schedule,
    students: enrollments.map((e) => {
      const result = existingByStudent.get(e.studentId._id.toString());
      return {
        resultId: result?._id ?? null,
        studentId: e.studentId._id,
        studentCode: e.studentId.studentId,
        fullName: e.studentId.fullName,
        rollNumber: e.rollNumber,
        marksObtained: result?.marksObtained ?? null,
        grade: result?.grade ?? null,
        resultStatus: result?.resultStatus ?? null,
      };
    }),
  };
}

async function enterMarks(payload, actingUser, req) {
  const { examId, subjectId, records } = payload;

  const exam = await Exam.findById(examId);
  if (!exam) {
    throw new ApiError(404, 'Exam not found');
  }
  if (exam.status === 'LOCKED' && actingUser.role !== 'ADMIN') {
    throw new ApiError(403, 'This exam is locked and can no longer be edited');
  }

  const schedule = await ExamSchedule.findOne({ examId, subjectId });
  if (!schedule) {
    throw new ApiError(404, 'No exam schedule found for this exam and subject');
  }

  await assertStaffAssigned(actingUser, exam, { classId: schedule.classId, subjectId });

  const results = [];
  for (const record of records) {
    if (record.marksObtained > schedule.maximumMarks) {
      throw new ApiError(422, `Marks obtained cannot exceed the maximum of ${schedule.maximumMarks}`);
    }

    const { grade } = calculateGrade(record.marksObtained, schedule.maximumMarks);
    const resultStatus = record.marksObtained >= schedule.passMarks ? 'PASS' : 'FAIL';

    const doc = await ExamResult.findOneAndUpdate(
      { examId, subjectId, studentId: record.studentId },
      {
        $set: {
          marksObtained: record.marksObtained,
          maximumMarks: schedule.maximumMarks,
          passMarks: schedule.passMarks,
          grade,
          resultStatus,
          remarks: record.remarks || null,
          updatedBy: actingUser._id,
        },
        $setOnInsert: { enteredBy: actingUser._id },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    results.push(doc);
  }

  await logActivity({
    user: actingUser,
    action: 'MARKS_ENTERED',
    entityType: 'ExamResult',
    entityId: `${examId}:${subjectId}`,
    description: `Entered marks for ${results.length} student(s)`,
    req,
  });

  return results;
}

async function updateResult(id, payload, actingAdmin, req) {
  const result = await ExamResult.findById(id);
  if (!result) {
    throw new ApiError(404, 'Result not found');
  }
  if (payload.marksObtained > result.maximumMarks) {
    throw new ApiError(422, `Marks obtained cannot exceed the maximum of ${result.maximumMarks}`);
  }

  const { grade } = calculateGrade(payload.marksObtained, result.maximumMarks);
  result.marksObtained = payload.marksObtained;
  result.grade = grade;
  result.resultStatus = payload.marksObtained >= result.passMarks ? 'PASS' : 'FAIL';
  result.remarks = payload.remarks ?? result.remarks;
  result.updatedBy = actingAdmin._id;
  await result.save();

  await logActivity({
    user: actingAdmin,
    action: 'MARKS_CORRECTED',
    entityType: 'ExamResult',
    entityId: result._id.toString(),
    description: 'Admin corrected exam result',
    req,
  });

  return result;
}

async function getStudentResults(studentProfileId, query = {}) {
  const match = { studentId: new mongoose.Types.ObjectId(studentProfileId) };

  const results = await ExamResult.find(match)
    .populate({ path: 'examId', select: 'examName status academicYearId' })
    .populate('subjectId', 'subjectName subjectCode');

  return results
    .filter((r) => ['COMPLETED', 'LOCKED'].includes(r.examId?.status))
    .filter((r) => !query.examId || r.examId._id.toString() === query.examId)
    .map((r) => ({
      id: r._id,
      examName: r.examId.examName,
      subjectName: r.subjectId.subjectName,
      marksObtained: r.marksObtained,
      maximumMarks: r.maximumMarks,
      grade: r.grade,
      resultStatus: r.resultStatus,
    }));
}

async function resolveStudentProfileForUser(userId) {
  return StudentProfile.findOne({ userId });
}

module.exports = {
  getRoster,
  enterMarks,
  updateResult,
  getStudentResults,
  resolveStudentProfileForUser,
};
