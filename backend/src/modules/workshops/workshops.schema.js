import { z } from 'zod'

const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Nhập giờ theo dạng HH:mm.')
export const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const hours = z.partialRecord(z.enum(days), z.array(z.tuple([clock, clock])).max(4))
const text = (max) => z.string().trim().max(max)
const required = (max) => text(max).min(1, 'Nhập thông tin này.')

export const profilePatch = z
  .strictObject({
    name: required(255),
    description: text(2000),
    history: text(10000),
    address: required(300),
    latitude: z.number().min(-85).max(85).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    isOpenForVisit: z.boolean(),
    openingHours: hours,
    acceptsOrders: z.boolean(),
    categoryIds: z
      .array(z.uuid())
      .max(100)
      .refine((ids) => new Set(ids).size === ids.length, 'Danh mục bị trùng.'),
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'Nhập ít nhất một trường cần lưu.')

export const mergedProfile = z
  .object({
    latitude: z.unknown(),
    longitude: z.unknown(),
    isOpenForVisit: z.boolean(),
    openingHours: hours,
  })
  .superRefine((row, ctx) => {
    if ((row.latitude == null) !== (row.longitude == null)) {
      ctx.addIssue({
        code: 'custom',
        path: [row.latitude == null ? 'latitude' : 'longitude'],
        message: 'Nhập đủ vĩ độ và kinh độ.',
      })
    }
    const intervals = Object.values(row.openingHours).flat()
    if (row.isOpenForVisit && intervals.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['openingHours'],
        message: 'Thêm ít nhất một khung giờ khi nhận khách.',
      })
    }
    for (const [day, slots] of Object.entries(row.openingHours)) {
      const ordered = [...slots].sort(([a], [b]) => a.localeCompare(b))
      if (ordered.some(([start, end]) => start >= end)) {
        ctx.addIssue({
          code: 'custom',
          path: ['openingHours', day],
          message: 'Giờ kết thúc phải sau giờ bắt đầu.',
        })
      } else if (ordered.some(([start], index) => index > 0 && ordered[index - 1][1] > start)) {
        ctx.addIssue({
          code: 'custom',
          path: ['openingHours', day],
          message: 'Các khung giờ trong ngày không được chồng nhau.',
        })
      }
    }
  })

export const certificateInput = z.strictObject({
  title: required(255),
  issuer: required(255),
  issuedAt: z
    .union([z.iso.date(), z.literal('')])
    .optional()
    .transform((date) => (date ? new Date(date + 'T00:00:00Z') : null)),
})
export const imageInput = z.strictObject({
  altText: z.union([text(300), z.array(text(300)).max(10)]).optional(),
})
export const imageOrder = z.strictObject({
  ids: z
    .array(z.uuid())
    .max(100)
    .refine((ids) => new Set(ids).size === ids.length, 'ID ảnh bị trùng.'),
})
export const byId = z.object({ id: z.uuid() })
export const bySlug = z.object({ slug: z.string().regex(/^[a-z0-9-]{1,255}$/) })
export const catalogQuery = z.object({
  q: text(100).optional(),
  categoryId: z.uuid().optional(),
  isOpenForVisit: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).max(1000000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})
