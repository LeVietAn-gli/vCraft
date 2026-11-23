import { AppError } from '../../errors.js'
import { certificateInput, imageInput } from './workshops.schema.js'

export function createWorkshopService(repository, media) {
  async function own(id) {
    const row = await repository.get(id)
    if (!row) throw new AppError(404, 'WORKSHOP_NOT_FOUND', 'Không tìm thấy hồ sơ xưởng.')
    return row
  }

  return {
    ...repository,
    async detail(slug) {
      const row = await repository.detail(slug)
      if (!row) throw new AppError(404, 'WORKSHOP_NOT_FOUND', 'Không tìm thấy xưởng công khai.')
      return { ...row, categories: row.categories.map(({ category }) => category) }
    },
    async own(id) {
      const row = await own(id)
      return {
        ...row,
        maxUploadMb: media.maxUploadMb,
        categoryIds: row.categories.map(({ category }) => category.id),
      }
    },
    async mayUpload(id) {
      const row = await own(id)
      if (row.status === 'REJECTED')
        throw new AppError(
          403,
          'WORKSHOP_NOT_APPROVED',
          'Hồ sơ đã bị từ chối. Liên hệ ban quản lý.',
        )
    },
    async uploadImages(ownerId, files, fields) {
      const { altText } = imageInput.parse(fields)
      const labels = typeof altText === 'string' ? [altText] : altText
      if (labels && labels.length !== files.length) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Mỗi ảnh cần một vị trí mô tả tương ứng.')
      }
      const rows = await media.upload(files, {}, (variants) =>
        repository.addImages(
          ownerId,
          variants.map((item, index) => ({ ...item, altText: labels?.[index] || null })),
        ),
      )
      return rows.sort((a, b) => a.sortOrder - b.sortOrder)
    },
    uploadCertificate(ownerId, file, fields) {
      const data = certificateInput.parse(fields)
      return media.upload(file ? [file] : [], { certificate: true }, ([{ imageUrl }]) =>
        repository.addCertificate(ownerId, { ...data, fileUrl: imageUrl }),
      )
    },
    async remove(ownerId, id, certificate) {
      const row = await repository.remove(ownerId, id, certificate)
      await media.clean(certificate ? [row.fileUrl] : [row.imageUrl, row.thumbUrl])
    },
  }
}
