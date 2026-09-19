const Exam = require('../models/Exam');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('../utils/activityLogger');

async function listExams(query) {
  const filter = {};
  if (query.academicYearId) filter.academicYearId = query.academicYearId;
  return Exam.find(filter).populate('academicYearId', 'name').sort({ startDate: -1 });
}

async function createExam(payload, actingAdmin, req) {
  const exam = await Exam.create(payload);
  await logActivity({
    user: actingAdmin,
    action: 'EXAM_CREATED',
    entityType: 'Exam',
    entityId: exam._id.toString(),
    description: `Created exam ${exam.examName}`,
    req,
  });
  return exam.populate('academicYearId', 'name');
}

async function setStatus(id, status, actingAdmin, req) {
  const exam = await Exam.findById(id);
  if (!exam) {
    throw new ApiError(404, 'Exam not found');
  }
  exam.status = status;
  await exam.save();

  await logActivity({
    user: actingAdmin,
    action: status === 'LOCKED' ? 'RESULT_LOCK' : 'RESULT_PUBLISH',
    entityType: 'Exam',
    entityId: exam._id.toString(),
    description: `Set exam ${exam.examName} status to ${status}`,
    req,
  });

  return exam.populate('academicYearId', 'name');
}

module.exports = { listExams, createExam, setStatus };
