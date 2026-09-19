const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid identifier');

const bulkPromoteSchema = z.object({
  fromAcademicYearId: objectId,
  fromClassId: objectId,
  fromSectionId: objectId,
  toAcademicYearId: objectId,
  toClassId: objectId,
  toSectionId: objectId,
  studentIds: z.array(objectId).min(1, 'Select at least one student'),
  status: z.enum(['PROMOTED', 'RETAINED', 'TRANSFERRED', 'GRADUATED']),
});

module.exports = { bulkPromoteSchema };
