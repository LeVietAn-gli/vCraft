import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { AppError } from '../../errors.js'
import { mergedProfile } from './workshops.schema.js'

const approved = { status: 'APPROVED' }
const category = { id: true, name: true, slug: true }
const image = { id: true, imageUrl: true, thumbUrl: true, altText: true, sortOrder: true }
const certificate = { id: true, title: true, issuer: true, issuedAt: true, fileUrl: true }
const publicFields = {
  slug: true,
  name: true,
  description: true,
  history: true,
  address: true,
  latitude: true,
  longitude: true,
  isOpenForVisit: true,
  openingHours: true,
  images: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], select: image },
  certificates: { orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], select: certificate },
  categories: {
    orderBy: { category: { name: 'asc' } },
    select: { category: { select: category } },
  },
  batches: {
    where: { isPublic: true },
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    select: { batchCode: true, name: true, status: true },
  },
}
const privateFields = {
  ...publicFields,
  batches: false,
  id: true,
  status: true,
  acceptsOrders: true,
  rejectionReason: true,
}

const itemFields = {
  slug: true,
  name: true,
  description: true,
  address: true,
  isOpenForVisit: true,
  images: { ...publicFields.images, take: 1 },
}
const notFound = () => new AppError(404, 'WORKSHOP_NOT_FOUND', 'Không tìm thấy hồ sơ xưởng.')
const missingMedia = () => new AppError(404, 'IMAGE_NOT_FOUND', 'Không tìm thấy ảnh.')

export function workshopRepository(db) {
  // Serialize changes to profiles, album positions, and their owning category links.
  function owned(ownerId, execute) {
    return db.$transaction(async (tx) => {
      const [workshop] =
        await tx.$queryRaw`SELECT "id", "latitude", "longitude", "isOpenForVisit", "openingHours", "status" FROM "Workshop" WHERE "ownerId" = ${ownerId}::uuid FOR UPDATE`
      if (!workshop) throw notFound()
      if (workshop.status === 'REJECTED') {
        throw new AppError(
          403,
          'WORKSHOP_NOT_APPROVED',
          'Hồ sơ đã bị từ chối. Liên hệ ban quản lý.',
        )
      }
      return execute(tx, workshop)
    })
  }

  return {
    get: (ownerId) => db.workshop.findUnique({ where: { ownerId }, select: privateFields }),
    categories: () =>
      db.category.findMany({ orderBy: [{ name: 'asc' }, { id: 'asc' }], select: category }),
    detail: (slug) => db.workshop.findFirst({ where: { slug, ...approved }, select: publicFields }),
    async list({ q, categoryId, isOpenForVisit, page, limit }) {
      const where = {
        ...approved,
        name: q ? { contains: q, mode: 'insensitive' } : undefined,
        categories: categoryId ? { some: { categoryId } } : undefined,
        isOpenForVisit,
      }
      const [rows, total] = await db.$transaction(
        async (tx) => {
          const rows = await tx.workshop.findMany({
            where,
            orderBy: [{ name: 'asc' }, { id: 'asc' }],
            skip: (page - 1) * limit,
            take: limit,
            select: itemFields,
          })
          return [rows, await tx.workshop.count({ where })]
        },
        { isolationLevel: 'RepeatableRead' },
      )
      return {
        data: rows.map(({ images, ...item }) => ({
          ...item,
          thumbUrl: images[0]?.thumbUrl ?? null,
        })),
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      }
    },
    async suggest(q) {
      const rows = await db.workshop.findMany({
        where: { ...approved, name: { contains: q, mode: 'insensitive' } },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        take: 8,
        select: { slug: true, name: true, images: { ...publicFields.images, take: 1 } },
      })
      return rows.map(({ images, ...item }) => ({ ...item, thumbUrl: images[0]?.thumbUrl ?? null }))
    },
    async map(isOpenForVisit) {
      const rows = await db.workshop.findMany({
        where: { ...approved, latitude: { not: null }, longitude: { not: null }, isOpenForVisit },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        select: {
          slug: true,
          name: true,
          latitude: true,
          longitude: true,
          isOpenForVisit: true,
          openingHours: true,
          images: { ...publicFields.images, take: 1 },
          categories: publicFields.categories,
        },
      })
      return rows.map(({ images, categories, ...item }) => ({
        ...item,
        thumbUrl: images[0]?.thumbUrl ?? null,
        categories: categories.map(({ category }) => category.name),
      }))
    },
    update(ownerId, { categoryIds, ...data }) {
      return owned(ownerId, async (tx, workshop) => {
        mergedProfile.parse({ ...workshop, ...data })
        if (categoryIds) {
          const count = await tx.category.count({ where: { id: { in: categoryIds } } })
          if (count !== categoryIds.length)
            throw new AppError(400, 'VALIDATION_ERROR', 'Có danh mục không tồn tại.')
          const removed = await tx.product.findFirst({
            where: { workshopId: workshop.id, categoryId: { notIn: categoryIds } },
            select: { id: true },
          })
          if (removed) throw new AppError(409, 'IN_USE', 'Giữ lại danh mục đang có sản phẩm.')
          await tx.workshopCategory.deleteMany({ where: { workshopId: workshop.id } })
          await tx.workshopCategory.createMany({
            data: categoryIds.map((categoryId) => ({ workshopId: workshop.id, categoryId })),
          })
        }
        return tx.workshop.update({ where: { id: workshop.id }, data, select: privateFields })
      })
    },
    addImages(ownerId, entries) {
      return owned(ownerId, async (tx, { id: workshopId }) => {
        const { _max, _count } = await tx.workshopImage.aggregate({
          where: { workshopId },
          _max: { sortOrder: true },
          _count: true,
        })
        if (_count + entries.length > 100)
          throw new AppError(409, 'ALBUM_FULL', 'Một album chứa tối đa 100 ảnh.')
        return tx.workshopImage.createManyAndReturn({
          data: entries.map((entry, index) => ({
            ...entry,
            workshopId,
            sortOrder: (_max.sortOrder ?? -1) + 1 + index,
          })),
          select: image,
        })
      })
    },
    orderImages(ownerId, ids) {
      return owned(ownerId, async (tx, { id: workshopId }) => {
        const current = await tx.workshopImage.findMany({
          where: { workshopId },
          select: { id: true },
        })
        if (current.length !== ids.length || !current.every(({ id }) => ids.includes(id))) {
          throw new AppError(409, 'ALBUM_CHANGED', 'Tải lại album rồi thử đổi thứ tự.')
        }
        for (const [sortOrder, id] of ids.entries()) {
          await tx.workshopImage.update({ where: { id }, data: { sortOrder } })
        }
        return tx.workshopImage.findMany({ where: { workshopId }, ...publicFields.images })
      })
    },
    addCertificate(ownerId, entry) {
      return owned(ownerId, (tx, workshop) =>
        tx.workshopCertificate.create({
          data: { ...entry, workshopId: workshop.id },
          select: certificate,
        }),
      )
    },
    remove(ownerId, id, isCertificate) {
      return owned(ownerId, async (tx, { id: workshopId }) => {
        const table = isCertificate ? tx.workshopCertificate : tx.workshopImage
        const row = await table.findFirst({ where: { id, workshopId } })
        if (!row) throw missingMedia()
        await table.delete({ where: { id } })
        return row
      })
    },
    async canReadMedia(url, user) {
      const workshop = { OR: [approved, ...(user?.id ? [{ ownerId: user.id }] : [])] }
      const accessible = user?.role === 'ADMIN' ? {} : { workshop }
      const [photo, document, product, milestone] = await Promise.all([
        db.workshopImage.findFirst({
          where: { OR: [{ imageUrl: url }, { thumbUrl: url }], ...accessible },
          select: { id: true },
        }),
        db.workshopCertificate.findFirst({
          where: { fileUrl: url, ...accessible },
          select: { id: true },
        }),
        db.productImage.findFirst({
          where: {
            OR: [{ imageUrl: url }, { thumbUrl: url }],
            product: {
              OR: [
                { status: 'VISIBLE', workshop: approved },
                ...(user?.id ? [{ workshop: { ownerId: user.id } }] : []),
              ],
            },
          },
          select: { id: true },
        }),
        db.milestoneImage.findFirst({
          where: {
            OR: [{ imageUrl: url }, { thumbUrl: url }],
            milestone: {
              batch: {
                OR: [
                  { isPublic: true, workshop: approved },
                  ...(user?.id ? [{ workshop: { ownerId: user.id } }] : []),
                ],
              },
            },
          },
          select: { id: true },
        }),
      ])
      return Boolean(photo || document || product || milestone)
    },

    lookupUser: (where) =>
      db.user.findFirst({
        where: { ...where, status: 'ACTIVE', passwordHash: 'DEMO_SESSION_ONLY' },
        select: { id: true, role: true, fullName: true },
      }),
    ownedBatch: (ownerId, id) =>
      db.productionBatch.findFirst({
        where: { id, workshop: { ownerId, status: 'APPROVED' } },
        select: { batchCode: true },
      }),
    async publicProducts({ page, limit }) {
      const where = { status: 'VISIBLE', workshop: approved }
      const [data, total] = await db.$transaction(
        async (tx) => {
          const rows = await tx.product.findMany({
            where,
            select: {
              slug: true,
              name: true,
              description: true,
              price: true,
              images: { where: { isPrimary: true }, select: { thumbUrl: true, altText: true } },
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
            skip: (page - 1) * limit,
            take: limit,
          })
          return [rows, await tx.product.count({ where })]
        },
        { isolationLevel: 'RepeatableRead' },
      )
      return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
    },
    async trace(batchCode) {
      const batch = await db.productionBatch.findFirst({
        where: { batchCode, isPublic: true, workshop: approved },
        select: {
          batchCode: true,
          name: true,
          description: true,
          status: true,
          startedAt: true,
          completedAt: true,
          workshop: {
            select: {
              name: true,
              slug: true,
              address: true,
              images: { ...publicFields.images, take: 1 },
            },
          },
          products: {
            where: { product: { status: 'VISIBLE' } },
            select: {
              quantity: true,
              product: {
                select: {
                  name: true,
                  slug: true,
                  images: { where: { isPrimary: true }, select: image },
                },
              },
            },
          },
          milestones: {
            orderBy: { orderIndex: 'asc' },
            select: {
              title: true,
              description: true,
              occurredAt: true,
              orderIndex: true,
              images: publicFields.images,
            },
          },
        },
      })
      if (!batch) return null
      const { images, ...workshop } = batch.workshop
      return {
        ...batch,
        workshop: { ...workshop, thumbUrl: images[0]?.thumbUrl ?? null },
        products: batch.products.map(({ quantity, product }) => ({
          quantity,
          name: product.name,
          slug: product.slug,
          thumbUrl: product.images[0]?.thumbUrl ?? null,
        })),
      }
    },
  }
}

export function connectDatabase(url) {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })
}
