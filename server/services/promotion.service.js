const Enrollment = require('../models/Enrollment');
const { logActivity } = require('../utils/activityLogger');

async function bulkPromote(payload, actingAdmin, req) {
  const { fromAcademicYearId, fromClassId, fromSectionId, toAcademicYearId, toClassId, toSectionId, studentIds, status } = payload;

  const promoted = [];
  const skipped = [];

  for (const studentId of studentIds) {
    const oldEnrollment = await Enrollment.findOne({
      studentId,
      academicYearId: fromAcademicYearId,
      classId: fromClassId,
      sectionId: fromSectionId,
    });

    if (!oldEnrollment) {
      skipped.push({ studentId, reason: 'No matching enrollment found for the source class/section/year' });
      continue;
    }

    oldEnrollment.status = status;
    await oldEnrollment.save();

    if (status === 'GRADUATED') {
      promoted.push({ studentId, action: 'GRADUATED' });
      continue;
    }

    const existingTarget = await Enrollment.findOne({ studentId, academicYearId: toAcademicYearId });
    if (existingTarget) {
      skipped.push({ studentId, reason: 'Student is already enrolled for the target academic year' });
      continue;
    }

    await Enrollment.create({
      studentId,
      academicYearId: toAcademicYearId,
      classId: toClassId,
      sectionId: toSectionId,
      status: 'ACTIVE',
    });
    promoted.push({ studentId, action: status });
  }

  await logActivity({
    user: actingAdmin,
    action: 'STUDENT_PROMOTION',
    entityType: 'Enrollment',
    entityId: `${fromClassId}:${fromSectionId}`,
    description: `Bulk promotion: ${promoted.length} promoted, ${skipped.length} skipped`,
    req,
  });

  return { promoted, skipped };
}

module.exports = { bulkPromote };
