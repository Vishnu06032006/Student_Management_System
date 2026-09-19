const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid identifier');

const markAttendanceSchema = z.object({
  academicYearId: objectId,
  classId: objectId,
  sectionId: objectId,
  subjectId: objectId,
  date: z.coerce.date(),
  records: z
    .array(
      z.object({
        studentId: objectId,
        status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
        remarks: z.string().optional().nullable(),
      })
    )
    .min(1, 'At least one attendance record is required'),
});

module.exports = { markAttendanceSchema };
