const Section = require('../models/Section');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('../utils/activityLogger');

async function listSections(query) {
  const filter = {};
  if (query.classId) filter.classId = query.classId;
  return Section.find(filter)
    .populate('classId', 'className')
    .populate('classTeacherId', 'fullName staffId')
    .sort({ name: 1 });
}

async function createSection(payload, actingAdmin, req) {
  const section = await Section.create(payload);
  await logActivity({
    user: actingAdmin,
    action: 'SECTION_CREATED',
    entityType: 'Section',
    entityId: section._id.toString(),
    description: `Created section ${section.name}`,
    req,
  });
  return section.populate([
    { path: 'classId', select: 'className' },
    { path: 'classTeacherId', select: 'fullName staffId' },
  ]);
}

async function updateSection(id, payload) {
  const section = await Section.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).populate([
    { path: 'classId', select: 'className' },
    { path: 'classTeacherId', select: 'fullName staffId' },
  ]);
  if (!section) {
    throw new ApiError(404, 'Section not found');
  }
  return section;
}

module.exports = { listSections, createSection, updateSection };
