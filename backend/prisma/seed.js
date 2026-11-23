import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readConfig } from '../src/config/env.js'
import { createMedia } from '../src/modules/media/media.service.js'
import { connectDatabase } from '../src/modules/workshops/workshops.repository.js'

const config = readConfig()
if (config.NODE_ENV === 'production') throw new Error('Seed chỉ dành cho database demo.')
const database = connectDatabase(config.DATABASE_URL)
const directory = resolve(fileURLToPath(new URL('../', import.meta.url)), config.UPLOAD_DIR)
const media = createMedia(directory, config.MAX_UPLOAD_MB)
const asset = (name) => ({
  path: fileURLToPath(new URL('../../frontend/public/images/' + name + '.webp', import.meta.url)),
})
await mkdir(directory, { recursive: true })
const image = (name, persist) => media.upload([asset(name)], {}, ([files]) => persist(files))

try {
  for (const [email, fullName, role] of [
    ['admin@vcraft.local', 'Ban quản lý demo', 'ADMIN'],
    ['buyer1@vcraft.local', 'Người mua demo', 'BUYER'],
    ['xuong1@vcraft.local', 'Nghệ nhân xưởng Men Lam', 'ARTISAN'],
    ['cho-duyet1@vcraft.local', 'Nghệ nhân xưởng Lửa Ấm', 'ARTISAN'],
  ]) {
    await database.user.upsert({
      where: { email },
      update: {},
      create: { email, fullName, role, passwordHash: 'DEMO_SESSION_ONLY' },
    })
  }
  const category = await database.category.upsert({
    where: { slug: 'gom-gia-dung' },
    update: {},
    create: { slug: 'gom-gia-dung', name: 'Gốm gia dụng' },
  })
  for (const [email, slug, name, status] of [
    ['xuong1@vcraft.local', 'men-lam', 'Xưởng gốm Men Lam', 'APPROVED'],
    ['cho-duyet1@vcraft.local', 'lua-am', 'Xưởng gốm Lửa Ấm', 'PENDING'],
  ]) {
    const owner = await database.user.findUniqueOrThrow({ where: { email } })
    const workshop = await database.workshop.upsert({
      where: { ownerId: owner.id },
      update: {},
      create: {
        slug,
        name,
        ownerId: owner.id,
        status,
        address: 'Bát Tràng, Hà Nội',
        description: 'Hồ sơ minh họa quy trình làm gốm và đón khách tham quan.',
        history: 'Gia đình truyền nghề vuốt dáng, vẽ men lam và nung gốm qua các thế hệ.',
        latitude: 20.976,
        longitude: 105.916,
        isOpenForVisit: true,
        openingHours: { sat: [['08:00', '16:30']], sun: [['08:00', '16:30']] },
        categories: { create: { categoryId: category.id } },
      },
    })
    if (!(await database.workshopImage.count({ where: { workshopId: workshop.id } }))) {
      await image('tho-gom', (files) =>
        database.workshopImage.create({
          data: { ...files, workshopId: workshop.id, altText: 'Ảnh minh họa người thợ vuốt gốm' },
        }),
      )
    }
    if (workshop.slug !== 'men-lam') continue
    const products = []
    for (const [slug, name, photo, altText, price] of [
      ['bat-ve-men-lam', 'Bát vẽ men lam', 've-men-lam', 'Nghệ nhân vẽ nét lam lên bát', 120000],
      ['bo-chen-men-lam', 'Bộ chén men lam', 'gom-men-lam', 'Bình và chén men lam', 420000],
    ]) {
      const product = await database.product.upsert({
        where: { slug },
        update: {},
        create: {
          slug,
          name,
          workshopId: workshop.id,
          categoryId: category.id,
          price,
          status: 'VISIBLE',
        },
      })
      if (product.workshopId !== workshop.id)
        throw new Error('Slug sản phẩm demo thuộc xưởng khác.')
      if (!(await database.productImage.count({ where: { productId: product.id } }))) {
        await image(photo, (files) =>
          database.productImage.create({
            data: { ...files, productId: product.id, altText, isPrimary: true },
          }),
        )
      }
      products.push(product)
    }
    const batch = await database.productionBatch.upsert({
      where: { batchCode: 'BT-DEMO-01' },
      update: {},
      create: {
        batchCode: 'BT-DEMO-01',
        name: 'Lô gốm men lam minh họa',
        workshopId: workshop.id,
        status: 'COMPLETED',
        isPublic: true,
        startedAt: new Date('2026-11-10T02:00:00Z'),
        completedAt: new Date('2026-11-13T03:00:00Z'),
        products: {
          create: products.map(({ id }, index) => ({ productId: id, quantity: index ? 4 : 10 })),
        },
      },
    })
    const milestone = await database.productionMilestone.upsert({
      where: { batchId_orderIndex: { batchId: batch.id, orderIndex: 0 } },
      update: {},
      create: {
        batchId: batch.id,
        orderIndex: 0,
        title: 'Vẽ nét lam',
        description: 'Nghệ nhân tạo họa tiết trước khi phủ men và nung.',
        occurredAt: new Date('2026-11-11T03:00:00Z'),
        updatedById: owner.id,
      },
    })
    if (!(await database.milestoneImage.count({ where: { milestoneId: milestone.id } }))) {
      await image('ve-men-lam', (files) =>
        database.milestoneImage.create({
          data: { ...files, milestoneId: milestone.id, altText: 'Mô phỏng công đoạn vẽ men lam' },
        }),
      )
    }
  }
  console.info('Đã nạp xưởng, sản phẩm, lô và tài khoản demo.')
} finally {
  await database.$disconnect()
}
