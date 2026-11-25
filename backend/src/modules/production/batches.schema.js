// File này làm gì: Kiểm tra dữ liệu lô, mốc và thứ tự nhật ký tại API.
// Ai gọi file này: Router quản lý sản xuất của nghệ nhân.
import { z } from 'zod'
import { catalogQuery } from '../workshops/workshops.schema.js'

const name = z.string().trim().min(1).max(255)
const description = z.string().trim().max(10000)
const batchStatus = z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
const products = z
  .array(
    z.strictObject({
      productId: z.uuid(),
      quantity: z.number().int().positive().max(2147483647),
    }),
  )
  .min(1, 'Chọn ít nhất một sản phẩm.')
  .refine(
    (items) => new Set(items.map(({ productId }) => productId)).size === items.length,
    'Mỗi sản phẩm chỉ được xuất hiện một lần trong lô.',
  )

export const batchQuery = catalogQuery
  .pick({ page: true, limit: true })
  .extend({ status: batchStatus.optional() })
export const createBatch = z.strictObject({ name, description: description.optional(), products })
export const patchBatch = createBatch
  .extend({
    status: batchStatus,
    isPublic: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Nhập thông tin cần cập nhật.')

export const createMilestone = z.strictObject({
  title: name,
  description: description.optional(),
  occurredAt: z.iso
    .datetime({ offset: true })
    .transform((value) => new Date(value))
    .nullable()
    .optional(),
})
export const patchMilestone = createMilestone
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Nhập thông tin cần cập nhật.')
export const milestoneOrder = z.strictObject({
  ids: z.array(z.uuid()).refine((ids) => new Set(ids).size === ids.length, 'ID mốc bị trùng.'),
})
