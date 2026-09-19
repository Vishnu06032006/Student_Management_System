const { z } = require('zod');

const createStaffSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().trim().min(1, 'Phone number is required'),
  dateOfBirth: z.coerce.date().optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
  address: z.string().trim().optional().nullable(),
  qualification: z.string().trim().optional().nullable(),
  department: z.string().trim().optional().nullable(),
  designation: z.string().trim().optional().nullable(),
  joiningDate: z.coerce.date().optional().nullable(),
  experience: z.coerce.number().min(0).optional().nullable(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'VISITING']).optional(),
});

const updateStaffSchema = createStaffSchema.partial().extend({
  staffStatus: z.enum(['ACTIVE', 'ON_LEAVE', 'INACTIVE', 'RESIGNED', 'RETIRED']).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['ENABLED', 'DISABLED']),
});

module.exports = { createStaffSchema, updateStaffSchema, updateStatusSchema };
