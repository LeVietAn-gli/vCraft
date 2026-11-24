import { AppError } from '../../errors.js'
import { approvedWorkshop } from '../workshops/approved-workshop.js'

const workshopFields = { id: true, slug: true, name: true }
const categoryFields = { id: true, slug: true, name: true }
const imageFields = {
  id: true,
  imageUrl: true,
  thumbUrl: true,
  altText: true,
  sortOrder: true,
  isPrimary: true,
}
const imageOrder = [{ sortOrder: 'asc' }, { id: 'asc' }]
const gallery = { orderBy: imageOrder, select: imageFields }
const cardFields = {
  slug: true,
  name: true,
  price: true,
  workshop: { select: workshopFields },
  category: { select: categoryFields },
  images: { where: { isPrimary: true }, take: 1, select: { thumbUrl: true, altText: true } },
}
const ownerFields = {
  id: true,
  slug: true,
  name: true,
  categoryId: true,
  description: true,
  specifications: true,
  price: true,
  status: true,
  images: gallery,
}
const detailFields = {
  ...cardFields,
  id: true,
  description: true,
  specifications: true,
  images: gallery,
  batches: {
    where: { batch: { isPublic: true } },
    orderBy: [{ batch: { createdAt: 'desc' } }, { batchId: 'asc' }],
    select: { quantity: true, batch: { select: { batchCode: true, name: true, status: true } } },
  },
}
const publicProduct = { status: 'VISIBLE', workshop: { status: 'APPROVED' } }
const missing = () => new AppError(404, 'PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.')
const noImage = () =>
  new AppError(
    409,
    'NO_IMAGE',
    'Sản phẩm công khai cần ít nhất một ảnh. Hãy ẩn sản phẩm trước nếu muốn gỡ ảnh cuối.',
  )

function pageResult(data, total, page, limit) {
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export function productRepository(db) {
  async function own(client, workshopId, id) {
    const product = await client.product.findFirst({
      where: { id, workshopId },
      select: ownerFields,
    })
    if (!product) throw missing()
    return product
  }

  function mutate(ownerId, action) {
    return db.$transaction(async (tx) => action(tx, await approvedWorkshop(tx, ownerId, true)))
  }

  async function checkCategory(tx, workshopId, categoryId) {
    const category = await tx.workshopCategory.findUnique({
      where: { workshopId_categoryId: { workshopId, categoryId } },
      select: { categoryId: true },
    })
    if (!category) throw new AppError(400, 'INVALID_CATEGORY', 'Chọn danh mục xưởng đã đăng ký.')
  }

  return {
    async catalog({ q, categoryId, workshop, minPrice, maxPrice, sort, page, limit }) {
      const descending = sort.startsWith('-')
      const field = descending ? sort.slice(1) : sort
      const direction = descending ? 'desc' : 'asc'
      const where = {
        ...publicProduct,
        workshop: { ...publicProduct.workshop, slug: workshop },
        categoryId,
        price:
          minPrice !== undefined || maxPrice !== undefined
            ? { gte: minPrice, lte: maxPrice }
            : undefined,
        OR: q
          ? [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ]
          : undefined,
      }
      const order =
        field === 'price' ? { price: { sort: direction, nulls: 'last' } } : { [field]: direction }
      return db.$transaction(
        async (tx) => {
          const rows = await tx.product.findMany({
            where,
            orderBy: [order, { id: 'asc' }],
            skip: (page - 1) * limit,
            take: limit,
            select: cardFields,
          })
          return pageResult(rows, await tx.product.count({ where }), page, limit)
        },
        { isolationLevel: 'RepeatableRead' },
      )
    },
    async detail(slug) {
      const product = await db.product.findFirst({
        where: { ...publicProduct, slug },
        select: detailFields,
      })
      if (!product) throw missing()
      const related = await db.product.findMany({
        where: { ...publicProduct, workshopId: product.workshop.id, id: { not: product.id } },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        take: 4,
        select: cardFields,
      })
      return {
        ...product,
        related,
        batches: product.batches.map(({ batch, quantity }) => ({ ...batch, quantity })),
      }
    },
    async list(ownerId, { page, limit, status }) {
      return db.$transaction(
        async (tx) => {
          const workshopId = await approvedWorkshop(tx, ownerId)
          const where = { workshopId, status }
          const rows = await tx.product.findMany({
            where,
            orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
            skip: (page - 1) * limit,
            take: limit,
            select: {
              id: true,
              slug: true,
              name: true,
              status: true,
              price: true,
              images: cardFields.images,
            },
          })
          return pageResult(rows, await tx.product.count({ where }), page, limit)
        },
        { isolationLevel: 'RepeatableRead' },
      )
    },
    get: async (ownerId, id) => own(db, await approvedWorkshop(db, ownerId), id),
    create(ownerId, slug, data) {
      return mutate(ownerId, async (tx, workshopId) => {
        await checkCategory(tx, workshopId, data.categoryId)
        return tx.product.create({ data: { ...data, workshopId, slug }, select: ownerFields })
      })
    },
    update(ownerId, id, data) {
      return mutate(ownerId, async (tx, workshopId) => {
        const product = await own(tx, workshopId, id)
        if (data.categoryId) await checkCategory(tx, workshopId, data.categoryId)
        if ((data.status ?? product.status) === 'VISIBLE' && !product.images.length) throw noImage()
        return tx.product.update({ where: { id }, data, select: ownerFields })
      })
    },
    remove(ownerId, id) {
      return mutate(ownerId, async (tx, workshopId) => {
        const product = await own(tx, workshopId, id)
        if (
          await tx.batchProduct.findFirst({ where: { productId: id }, select: { batchId: true } })
        ) {
          throw new AppError(
            409,
            'IN_USE',
            'Sản phẩm đã thuộc một lô. Chuyển sang Ẩn để giữ truy xuất.',
          )
        }
        await tx.product.delete({ where: { id } })
        return product.images
      })
    },
    append(ownerId, id, entries) {
      return mutate(ownerId, async (tx, workshopId) => {
        const { images } = await own(tx, workshopId, id)
        if (images.length + entries.length > 100)
          throw new AppError(409, 'ALBUM_FULL', 'Tối đa 100 ảnh mỗi sản phẩm.')
        const next = (images.at(-1)?.sortOrder ?? -1) + 1
        const added = await tx.productImage.createManyAndReturn({
          data: entries.map((entry, index) => ({
            ...entry,
            productId: id,
            sortOrder: next + index,
            isPrimary: index === 0 && !images.some(({ isPrimary }) => isPrimary),
          })),
          select: imageFields,
        })
        return added.sort((a, b) => a.sortOrder - b.sortOrder)
      })
    },
    reorder(ownerId, id, ids) {
      return mutate(ownerId, async (tx, workshopId) => {
        const { images } = await own(tx, workshopId, id)
        if (images.length !== ids.length || images.some(({ id }) => !ids.includes(id))) {
          throw new AppError(409, 'ALBUM_CHANGED', 'Album đã thay đổi. Tải lại album.')
        }
        for (const [sortOrder, imageId] of ids.entries()) {
          await tx.productImage.update({ where: { id: imageId }, data: { sortOrder } })
        }
        return tx.productImage.findMany({ where: { productId: id }, ...gallery })
      })
    },
    primary(ownerId, id, imageId) {
      return mutate(ownerId, async (tx, workshopId) => {
        const { images } = await own(tx, workshopId, id)
        if (!images.some((image) => image.id === imageId)) throw missing()
        await tx.productImage.updateMany({
          where: { productId: id, isPrimary: true },
          data: { isPrimary: false },
        })
        await tx.productImage.update({ where: { id: imageId }, data: { isPrimary: true } })
        return tx.productImage.findMany({ where: { productId: id }, ...gallery })
      })
    },
    removeImage(ownerId, id, imageId) {
      return mutate(ownerId, async (tx, workshopId) => {
        const { images, status } = await own(tx, workshopId, id)
        const image = images.find(({ id }) => id === imageId)
        if (!image) throw missing()
        if (images.length === 1 && status === 'VISIBLE') throw noImage()
        await tx.productImage.delete({ where: { id: imageId } })
        const next = images.find(({ id }) => id !== imageId)
        if (image.isPrimary && next) {
          await tx.productImage.update({ where: { id: next.id }, data: { isPrimary: true } })
        }
        return image
      })
    },
  }
}
