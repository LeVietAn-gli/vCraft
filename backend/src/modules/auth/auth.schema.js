import { z } from 'zod';
const phone = z.string().trim().max(20).regex(/^[0-9+().\s-]*$/, 'Số điện thoại không hợp lệ').optional().nullable();
export const registerSchema = z.object({
  role: z.enum(['BUYER', 'ARTISAN']),
  email: z.string().trim().email().max(255).transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(128),
  fullName: z.string().trim().min(2).max(150),
  phone,
  workshop: z.object({
    name: z.string().trim().min(2).max(255),
    address: z.string().trim().min(5).max(500),
    categoryIds: z.array(z.string().uuid()).default([]),
  }).optional(),
}).superRefine((value, ctx) => {
  if (value.role === 'ARTISAN' && !value.workshop) ctx.addIssue({ code: 'custom', path: ['workshop'], message: 'Nghệ nhân cần thông tin xưởng' });
  if (value.role === 'BUYER' && value.workshop) ctx.addIssue({ code: 'custom', path: ['workshop'], message: 'Buyer không tạo xưởng' });
});
export const loginSchema = z.object({
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  password: z.string().min(1),
});
