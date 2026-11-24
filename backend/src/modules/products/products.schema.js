import { z } from 'zod'
import { catalogQuery } from '../workshops/workshops.schema.js'

export const money = z
  .union([z.string(), z.number()])
  .transform(String)
  .pipe(
    z
      .string()
      .regex(/^\d{1,10}(?:\.\d{1,2})?$/, 'Nhập giá từ 0 đến 9999999999,99, tối đa hai số lẻ.'),
  )
const status = z.enum(['HIDDEN', 'VISIBLE'])
const attributes = {
  name: z.string().trim().min(1).max(255),
  categoryId: z.uuid(),
  description: z.string().trim().max(10000),
  specifications: z
    .record(z.string().trim().min(1).max(100), z.string().trim().max(1000))
    .refine((entries) => Object.keys(entries).length <= 30, 'Tối đa 30 thông số.'),
  price: money.nullable(),
}
export const newProduct = z.strictObject({
  ...attributes,
  description: attributes.description.optional(),
  specifications: attributes.specifications.optional(),
  price: attributes.price.optional(),
})
export const editProduct = z
  .strictObject({ ...attributes, status })
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Nhập ít nhất một trường cần lưu.')
export const managedQuery = catalogQuery
  .pick({ page: true, limit: true })
  .extend({ status: status.optional() })
export const productQuery = catalogQuery
  .pick({ page: true, limit: true, q: true, categoryId: true })
  .extend({
    workshop: z
      .string()
      .regex(/^[a-z0-9-]{1,255}$/)
      .optional(),
    minPrice: money.optional(),
    maxPrice: money.optional(),
    sort: z
      .enum(['createdAt', '-createdAt', 'price', '-price', 'name', '-name'])
      .default('-createdAt'),
  })
  .refine(
    ({ minPrice, maxPrice }) =>
      minPrice === undefined || maxPrice === undefined || Number(minPrice) <= Number(maxPrice),
    {
      path: ['maxPrice'],
      message: 'Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu.',
    },
  )
export const productImageId = z.object({ id: z.uuid(), imageId: z.uuid() })
