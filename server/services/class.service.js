const Class = require('../models/Class');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('../utils/activityLogger');

async function listClasses(query) {
  const filter = {};
  if (query.academicYearId) filter.academicYearId = query.academicYearId;
  return Class.find(filter).populate('academicYearId', 'name isActive').sort({ className: 1 });
}

async function createClass(payload, actingAdmin, req) {
  const cls = await Class.create(payload);
  await logActivity({
    user: actingAdmin,
    action: 'CLASS_CREATED',
    entityType: 'Class',
    entityId: cls._id.toString(),
    description: `Created class ${cls.className}`,
    req,
  });
  return cls.populate('academicYearId', 'name isActive');
}

async function updateClass(id, payload) {
  const cls = await Class.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).populate(
    'academicYearId',
    'name isActive'
  );
  if (!cls) {
    throw new ApiError(404, 'Class not found');
  }
  return cls;
}

module.exports = { listClasses, createClass, updateClass };
