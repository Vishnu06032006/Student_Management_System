const TeacherAssignment = require('../models/TeacherAssignment');
const Section = require('../models/Section');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('../utils/activityLogger');

const POPULATE = [
  { path: 'staffId', select: 'staffId fullName' },
  { path: 'academicYearId', select: 'name' },
  { path: 'classId', select: 'className' },
  { path: 'sectionId', select: 'name' },
  { path: 'subjectId', select: 'subjectCode subjectName' },
];

async function listTeacherAssignments(query) {
  const filter = {};
  if (query.academicYearId) filter.academicYearId = query.academicYearId;
  if (query.staffId) filter.staffId = query.staffId;
  if (query.classId) filter.classId = query.classId;
  if (query.sectionId) filter.sectionId = query.sectionId;
  return TeacherAssignment.find(filter).populate(POPULATE).sort({ createdAt: -1 });
}

async function createTeacherAssignment(payload, actingAdmin, req) {
  const section = await Section.findById(payload.sectionId);
  if (!section || section.classId.toString() !== payload.classId) {
    throw new ApiError(422, 'Selected section does not belong to the selected class');
  }

  if (payload.isClassTeacher) {
    const existingClassTeacher = await TeacherAssignment.findOne({
      sectionId: payload.sectionId,
      academicYearId: payload.academicYearId,
      isClassTeacher: true,
    });
    if (existingClassTeacher) {
      throw new ApiError(409, 'This section already has a class teacher for the selected academic year');
    }
  }

  let assignment;
  try {
    assignment = await TeacherAssignment.create(payload);
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, 'This teacher is already assigned to this class/section/subject');
    }
    throw err;
  }

  await logActivity({
    user: actingAdmin,
    action: 'TEACHER_ASSIGNED',
    entityType: 'TeacherAssignment',
    entityId: assignment._id.toString(),
    description: 'Assigned teacher to class/section/subject',
    req,
  });

  return assignment.populate(POPULATE);
}

async function listMyAssignments(staffUserId) {
  const StaffProfile = require('../models/StaffProfile');
  const staffProfile = await StaffProfile.findOne({ userId: staffUserId });
  if (!staffProfile) return [];
  return TeacherAssignment.find({ staffId: staffProfile._id }).populate(POPULATE).sort({ createdAt: -1 });
}

module.exports = { listTeacherAssignments, createTeacherAssignment, listMyAssignments };
