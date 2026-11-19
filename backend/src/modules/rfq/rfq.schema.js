import { z } from 'zod';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có dạng yyyy-mm-dd')
  .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00.000Z`)) && new Date(`${v}T00:00:00.000Z`).toISOString().slice(0, 10) === v,
    'Ngày không tồn tại')
  .transform((v) => new Date(`${v}T00:00:00.000Z`));
const money = z.union([z.number(), z.string().regex(/^\d+(\.\d{1,2})?$/)])
  .refine((v) => Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= 9999999999.99, 'Giá trị tiền không hợp lệ')
  .transform((v) => Number(v).toFixed(2));
const fields = {
  title: z.string().trim().min(5).max(200),
  categoryId: z.string().uuid(),
  referenceProductId: z.string().uuid().nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  quantity: z.number().int().positive().max(100000000),
  unit: z.string().trim().min(1).max(30).default('chiếc'),
  budgetMax: money.nullable().optional(),
  bidDeadline: z.string().datetime({ offset: true }).transform((v) => new Date(v)),
  requiredBy: dateOnly,
  contactName: z.string().trim().min(2).max(150).optional(),
  contactPhone: z.string().trim().max(20).optional().nullable(),
  deliveryAddress: z.string().trim().min(5).max(300),
};
export const createRfqSchema = z.object(fields).strict();
export const editRfqSchema = z.object({
  ...Object.fromEntries(Object.entries(fields).map(([key, schema]) => [key, schema.optional()])),
}).strict().refine((v) => Object.keys(v).length > 0, 'Cần ít nhất một trường để sửa');
export const listRfqSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(['DRAFT', 'SENT', 'BIDDING', 'ACCEPTED', 'IN_PRODUCTION', 'DELIVERED']).optional(),
}).strict();
export const idSchema = z.object({ id: z.string().uuid() });
