const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid identifier');

const createAcademicYearSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

const createClassSchema = z.object({
  className: z.string().trim().min(1, 'Class name is required'),
  academicYearId: objectId,
  description: z.string().trim().optional().nullable(),
});

const updateClassSchema = z.object({
  className: z.string().trim().min(1).optional(),
  description: z.string().trim().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const createSectionSchema = z.object({
  name: z.string().trim().min(1, 'Section name is required'),
  classId: objectId,
  classTeacherId: objectId.optional().nullable(),
  capacity: z.coerce.number().min(1).optional().nullable(),
});

const updateSectionSchema = z.object({
  name: z.string().trim().min(1).optional(),
  classTeacherId: objectId.optional().nullable(),
  capacity: z.coerce.number().min(1).optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const createSubjectSchema = z.object({
  subjectCode: z.string().trim().min(1, 'Subject code is required'),
  subjectName: z.string().trim().min(1, 'Subject name is required'),
  classId: objectId,
  maximumMarks: z.coerce.number().min(1),
  passMarks: z.coerce.number().min(0),
});

const updateSubjectSchema = z.object({
  subjectName: z.string().trim().min(1).optional(),
  maximumMarks: z.coerce.number().min(1).optional(),
  passMarks: z.coerce.number().min(0).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const createEnrollmentSchema = z.object({
  studentId: objectId,
  academicYearId: objectId,
  classId: objectId,
  sectionId: objectId,
  rollNumber: z.string().trim().optional().nullable(),
});

const createTeacherAssignmentSchema = z.object({
  staffId: objectId,
  academicYearId: objectId,
  classId: objectId,
  sectionId: objectId,
  subjectId: objectId,
  isClassTeacher: z.boolean().optional(),
});

module.exports = {
  createAcademicYearSchema,
  createClassSchema,
  updateClassSchema,
  createSectionSchema,
  updateSectionSchema,
  createSubjectSchema,
  updateSubjectSchema,
  createEnrollmentSchema,
  createTeacherAssignmentSchema,
};
