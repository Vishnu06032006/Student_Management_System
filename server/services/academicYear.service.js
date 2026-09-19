const AcademicYear = require('../models/AcademicYear');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('../utils/activityLogger');

async function listAcademicYears() {
  return AcademicYear.find().sort({ startDate: -1 });
}

async function createAcademicYear(payload, actingAdmin, req) {
  const year = await AcademicYear.create(payload);
  await logActivity({
    user: actingAdmin,
    action: 'ACADEMIC_YEAR_CREATED',
    entityType: 'AcademicYear',
    entityId: year._id.toString(),
    description: `Created academic year ${year.name}`,
    req,
  });
  return year;
}

async function setActiveAcademicYear(id, actingAdmin, req) {
  const year = await AcademicYear.findById(id);
  if (!year) {
    throw new ApiError(404, 'Academic year not found');
  }

  await AcademicYear.updateMany({ _id: { $ne: id } }, { $set: { isActive: false } });
  year.isActive = true;
  await year.save();

  await logActivity({
    user: actingAdmin,
    action: 'ACADEMIC_YEAR_ACTIVATED',
    entityType: 'AcademicYear',
    entityId: year._id.toString(),
    description: `Marked academic year ${year.name} as active`,
    req,
  });

  return year;
}

module.exports = { listAcademicYears, createAcademicYear, setActiveAcademicYear };
