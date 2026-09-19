const Enrollment = require('../models/Enrollment');
const Section = require('../models/Section');
const StudentProfile = require('../models/StudentProfile');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('../utils/activityLogger');

const POPULATE = [
  { path: 'studentId', select: 'studentId fullName' },
  { path: 'academicYearId', select: 'name' },
  { path: 'classId', select: 'className' },
  { path: 'sectionId', select: 'name' },
];

async function listEnrollments(query) {
  const filter = {};
  if (query.academicYearId) filter.academicYearId = query.academicYearId;
  if (query.classId) filter.classId = query.classId;
  if (query.sectionId) filter.sectionId = query.sectionId;
  if (query.studentId) filter.studentId = query.studentId;
  return Enrollment.find(filter).populate(POPULATE).sort({ createdAt: -1 });
}

async function createEnrollment(payload, actingAdmin, req) {
  const section = await Section.findById(payload.sectionId);
  if (!section || section.classId.toString() !== payload.classId) {
    throw new ApiError(422, 'Selected section does not belong to the selected class');
  }

  let enrollment;
  try {
    enrollment = await Enrollment.create(payload);
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, 'This student is already enrolled for the selected academic year');
    }
    throw err;
  }

  await logActivity({
    user: actingAdmin,
    action: 'STUDENT_ENROLLED',
    entityType: 'Enrollment',
    entityId: enrollment._id.toString(),
    description: `Enrolled student into class/section for the academic year`,
    req,
  });

  return enrollment.populate(POPULATE);
}

async function resolveActiveEnrollmentForUser(userId) {
  const profile = await StudentProfile.findOne({ userId });
  if (!profile) return null;

  const enrollment = await Enrollment.findOne({ studentId: profile._id, status: 'ACTIVE' })
    .sort({ createdAt: -1 })
    .populate([
      { path: 'academicYearId', select: 'name isActive' },
      { path: 'classId', select: 'className' },
      { path: 'sectionId', select: 'name' },
    ]);
  if (!enrollment) return null;

  return { profile, enrollment };
}

module.exports = { listEnrollments, createEnrollment, resolveActiveEnrollmentForUser };
