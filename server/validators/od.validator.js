const { z } = require('zod');

const odItemInputSchema = z.object({
  date: z.coerce.date(),
  subjectId: z.string().min(1),
});

const createODRequestSchema = z
  .object({
    eventName: z.string().trim().min(1, 'Event name is required'),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    session: z.enum(['FULL_DAY', 'HALF_DAY']),
    halfDaySession: z.enum(['FN', 'AN']).optional().nullable(),
    // Sent as a JSON string over multipart/form-data alongside the proof file.
    items: z
      .string()
      .min(1, 'Select at least one subject')
      .transform((raw, ctx) => {
        try {
          return odItemInputSchema.array().min(1, 'Select at least one subject').parse(JSON.parse(raw));
        } catch {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid items payload' });
          return z.NEVER;
        }
      }),
  })
  .refine((d) => d.endDate >= d.startDate, { message: 'End date must be on or after start date', path: ['endDate'] })
  .refine((d) => d.session !== 'HALF_DAY' || !!d.halfDaySession, {
    message: 'Select FN or AN for a half day',
    path: ['halfDaySession'],
  });

const decideODItemSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  comment: z.string().optional().nullable(),
});

module.exports = { createODRequestSchema, decideODItemSchema };
