import { z } from 'zod';
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
}).passthrough();
export const paginationMeta = (page, limit, total) => ({ page, limit, total, totalPages: Math.ceil(total / limit) });
