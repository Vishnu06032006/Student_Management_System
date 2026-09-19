const Subject = require('../models/Subject');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('../utils/activityLogger');

async function listSubjects(query) {
  const filter = {};
  if (query.classId) filter.classId = query.classId;
  return Subject.find(filter).populate('classId', 'className').sort({ subjectName: 1 });
}

async function createSubject(payload, actingAdmin, req) {
  if (payload.passMarks > payload.maximumMarks) {
    throw new ApiError(422, 'Pass marks cannot exceed maximum marks');
  }
  const subject = await Subject.create(payload);
  await logActivity({
    user: actingAdmin,
    action: 'SUBJECT_CREATED',
    entityType: 'Subject',
    entityId: subject._id.toString(),
    description: `Created subject ${subject.subjectCode} - ${subject.subjectName}`,
    req,
  });
  return subject.populate('classId', 'className');
}

async function updateSubject(id, payload) {
  if (payload.passMarks != null && payload.maximumMarks != null && payload.passMarks > payload.maximumMarks) {
    throw new ApiError(422, 'Pass marks cannot exceed maximum marks');
  }
  const subject = await Subject.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).populate(
    'classId',
    'className'
  );
  if (!subject) {
    throw new ApiError(404, 'Subject not found');
  }
  return subject;
}

module.exports = { listSubjects, createSubject, updateSubject };
