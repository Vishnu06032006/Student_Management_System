const { z } = require('zod');

const createStudentSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().trim().min(1, 'Phone number is required'),
  dateOfBirth: z.coerce.date().optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
  bloodGroup: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  admissionNumber: z.string().trim().optional().nullable(),
  rollNumber: z.string().trim().optional().nullable(),
  admissionDate: z.coerce.date().optional().nullable(),
  fatherName: z.string().trim().optional().nullable(),
  motherName: z.string().trim().optional().nullable(),
  guardianName: z.string().trim().optional().nullable(),
  parentPhone: z.string().trim().optional().nullable(),
  parentEmail: z.string().trim().email('Invalid parent email').optional().nullable().or(z.literal('')),
});

const updateStudentSchema = createStudentSchema.partial().extend({
  studentStatus: z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED', 'SUSPENDED']).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['ENABLED', 'DISABLED']),
});

module.exports = { createStudentSchema, updateStudentSchema, updateStatusSchema };
