import { z } from 'zod'

export const phone = z
  .string()
  .trim()
  .max(20)
  .regex(/^\+?[\d ()-]+$/, 'Kiểm tra số điện thoại.')
  .refine(
    (value) => /^\d{8,15}$/.test(value.replace(/\D/g, '')),
    'Số điện thoại cần từ 8 đến 15 chữ số.',
  )
