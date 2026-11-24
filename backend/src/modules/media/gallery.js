import { AppError } from '../../errors.js'
import { z } from 'zod'

const alt = z.string().trim().max(300)
const imageInput = z.strictObject({ altText: z.union([alt, z.array(alt).max(10)]).optional() })

export function uploadGallery(media, files, fields, persist) {
  const { altText } = imageInput.parse(fields ?? {})
  const labels = typeof altText === 'string' ? [altText] : altText
  if (labels && labels.length !== files.length) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Gửi một vị trí mô tả cho mỗi ảnh.')
  }
  return media.upload(files, {}, (variants) =>
    persist(variants.map((item, index) => ({ ...item, altText: labels?.[index] || null }))),
  )
}
