const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid identifier');

const createExamSchema = z
  .object({
    examName: z.string().trim().min(1, 'Exam name is required'),
    academicYearId: objectId,
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  });

const createExamScheduleSchema = z.object({
  examId: objectId,
  subjectId: objectId,
  classId: objectId,
  examDate: z.coerce.date(),
  startTime: z.string().min(1, 'Required'),
  endTime: z.string().min(1, 'Required'),
  maximumMarks: z.coerce.number().min(1),
  passMarks: z.coerce.number().min(0),
});

const enterMarksSchema = z.object({
  examId: objectId,
  subjectId: objectId,
  records: z
    .array(
      z.object({
        studentId: objectId,
        marksObtained: z.coerce.number().min(0),
        maximumMarks: z.coerce.number().min(1),
        remarks: z.string().optional().nullable(),
      })
    )
    .min(1, 'At least one result is required'),
});

const updateResultSchema = z.object({
  marksObtained: z.coerce.number().min(0),
  remarks: z.string().optional().nullable(),
});

module.exports = { createExamSchema, createExamScheduleSchema, enterMarksSchema, updateResultSchema };
