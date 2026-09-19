const { z } = require('zod');

const createLeaveSchema = z
  .object({
    leaveType: z.enum(['SICK', 'CASUAL', 'EMERGENCY', 'OTHER']),
    fromDate: z.coerce.date(),
    toDate: z.coerce.date(),
    reason: z.string().trim().min(1, 'Reason is required'),
  })
  .refine((d) => d.toDate >= d.fromDate, {
    message: 'To date must be on or after from date',
    path: ['toDate'],
  });

const decideLeaveSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  approvalComment: z.string().optional().nullable(),
});

module.exports = { createLeaveSchema, decideLeaveSchema };
