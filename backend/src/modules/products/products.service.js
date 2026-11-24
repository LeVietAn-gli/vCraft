import { randomBytes } from 'node:crypto'
import { AppError } from '../../errors.js'
import { uploadGallery } from '../media/gallery.js'

function slugBase(name) {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replaceAll('đ', 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 200)
      .replace(/-$/, '') || 'san-pham'
  )
}

export function createProductService(repository, media) {
  return {
    ...repository,
    async create(ownerId, body) {
      const base = slugBase(body.name)
      for (let attempt = 0; attempt < 4; attempt++) {
        const slug = attempt === 0 ? base : base + '-' + randomBytes(4).toString('hex')
        try {
          return await repository.create(ownerId, slug, body)
        } catch (error) {
          if (error.code !== 'P2002') throw error
        }
      }
      throw new AppError(409, 'SLUG_CONFLICT', 'Chưa tạo được địa chỉ sản phẩm. Hãy thử lại.')
    },
    async remove(ownerId, id) {
      const images = await repository.remove(ownerId, id)
      await media.clean(images.flatMap(({ imageUrl, thumbUrl }) => [imageUrl, thumbUrl]))
    },
    upload(ownerId, id, files, fields) {
      return uploadGallery(media, files, fields, (entries) =>
        repository.append(ownerId, id, entries),
      )
    },
    async removeImage(ownerId, id, imageId) {
      const image = await repository.removeImage(ownerId, id, imageId)
      await media.clean([image.imageUrl, image.thumbUrl])
    },
  }
}
