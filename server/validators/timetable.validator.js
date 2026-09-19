const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid identifier');

const createTimetableSchema = z.object({
  academicYearId: objectId,
  classId: objectId,
  sectionId: objectId,
  day: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']),
  period: z.coerce.number().min(1).max(12),
  subjectId: objectId,
  staffId: objectId,
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  room: z.string().optional().nullable(),
});

module.exports = { createTimetableSchema };
