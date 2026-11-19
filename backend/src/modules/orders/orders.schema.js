import { z } from 'zod';
export const idSchema = z.object({ id: z.string().uuid() });
export const rejectSchema = z.object({ reason: z.string().trim().max(500).optional().default('') }).strict();
export const orderListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(['IN_PRODUCTION', 'READY', 'DELIVERED']).optional(),
}).strict();
