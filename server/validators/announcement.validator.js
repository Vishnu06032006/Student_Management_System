const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid identifier');

const createAnnouncementSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  message: z.string().trim().min(1, 'Message is required'),
  audience: z.enum(['ALL', 'ALL_STUDENTS', 'ALL_STAFF', 'CLASS', 'SECTION', 'INDIVIDUAL']),
  audienceRef: objectId.optional().nullable(),
  expiryDate: z.coerce.date().optional().nullable(),
  priority: z.enum(['NORMAL', 'IMPORTANT', 'URGENT']).optional(),
});

module.exports = { createAnnouncementSchema };
