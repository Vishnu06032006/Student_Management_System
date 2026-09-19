const ExamSchedule = require('../models/ExamSchedule');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('../utils/activityLogger');

const POPULATE = [
  { path: 'subjectId', select: 'subjectName subjectCode' },
  { path: 'classId', select: 'className' },
];

async function listSchedules(query) {
  const filter = {};
  if (query.examId) filter.examId = query.examId;
  if (query.classId) filter.classId = query.classId;
  return ExamSchedule.find(filter).populate(POPULATE).sort({ examDate: 1 });
}

async function createSchedule(payload, actingAdmin, req) {
  if (payload.passMarks > payload.maximumMarks) {
    throw new ApiError(422, 'Pass marks cannot exceed maximum marks');
  }

  let schedule;
  try {
    schedule = await ExamSchedule.create(payload);
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, 'This subject is already scheduled for this exam and class');
    }
    throw err;
  }

  await logActivity({
    user: actingAdmin,
    action: 'EXAM_SCHEDULE_CREATED',
    entityType: 'ExamSchedule',
    entityId: schedule._id.toString(),
    description: 'Created exam schedule entry',
    req,
  });

  return schedule.populate(POPULATE);
}

module.exports = { listSchedules, createSchedule };
