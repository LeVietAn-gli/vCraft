import { phone } from '../auth/phone.js'
import { z } from 'zod'
import { money } from '../products/products.schema.js'
import { catalogQuery } from '../workshops/workshops.schema.js'

const nonempty = (max) => z.string().trim().min(1).max(max)
export const contact = z.strictObject({
  contactName: nonempty(150),
  contactPhone: phone.nullable(),
  deliveryAddress: nonempty(300),
})
const fields = contact.extend({
  contactName: contact.shape.contactName.optional(),
  contactPhone: contact.shape.contactPhone.optional(),
  categoryId: z.uuid(),
  referenceProductId: z.uuid().nullable().optional(),
  title: nonempty(200),
  description: nonempty(10000),
  quantity: z.number().int().positive().max(2147483647),
  unit: nonempty(30),
  budgetMax: money.nullable().optional(),
  bidDeadline: z.iso.datetime({ offset: true }),
  requiredBy: z.iso.date(),
})
export const draft = fields.extend({ unit: fields.shape.unit.default('chiếc') })
export const patch = fields
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Nhập ít nhất một trường cần lưu.')
export function checkDates(value) {
  const bid = new Date(value.bidDeadline)
  const delivery = new Date(value.requiredBy)
  if (bid <= new Date())
    throw new z.ZodError([
      { code: 'custom', path: ['bidDeadline'], message: 'Hạn nhận báo giá phải ở tương lai.' },
    ])
  if (delivery <= bid)
    throw new z.ZodError([
      { code: 'custom', path: ['requiredBy'], message: 'Ngày cần hàng phải sau hạn báo giá.' },
    ])
}
export const listQuery = (statuses) =>
  catalogQuery.pick({ page: true, limit: true }).extend({ status: z.enum(statuses).optional() })
export const rfqQuery = listQuery([
  'DRAFT',
  'SENT',
  'BIDDING',
  'ACCEPTED',
  'IN_PRODUCTION',
  'DELIVERED',
])
export const orderQuery = listQuery(['IN_PRODUCTION', 'READY', 'DELIVERED'])
export const reason = z.strictObject({ reason: z.string().trim().max(2000).optional() })
