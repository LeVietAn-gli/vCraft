import { batchRepository } from '../src/modules/production/batches.repository.js'
import { milestoneRepository } from '../src/modules/production/milestones.repository.js'
import { productRepository } from '../src/modules/products/products.repository.js'
import { milestoneImageRepository } from '../src/modules/production/milestone-images.repository.js'
import assert from 'node:assert/strict'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import sharp from 'sharp'
import { createApp, requireArtisan } from '../src/app.js'
import { demoDataRoutes } from '../src/demo/routes.js'
import { installDemoSession } from '../src/demo/session.js'
import { createMedia } from '../src/modules/media/media.service.js'
import {
  connectDatabase,
  workshopRepository,
} from '../src/modules/workshops/workshops.repository.js'

const url = process.env.VCRAFT_TEST_DATABASE_URL
const origin = 'http://localhost:5173'
const password = 'week-one-test-password'

test('N2 tuần 1–3: API, quyền, upload và ràng buộc PostgreSQL', { skip: !url }, async (t) => {
  const database = connectDatabase(url)
  const directory = await mkdtemp(join(tmpdir(), 'vcraft-n2-test-'))
  const users = await Promise.all(
    ['ARTISAN', 'ARTISAN', 'BUYER', 'ARTISAN'].map((role, index) =>
      database.user.create({
        data: {
          role,
          fullName: 'Test ' + index,
          email: `test-${process.pid}-${index}@vcraft.local`,
          passwordHash: 'DEMO_SESSION_ONLY',
        },
      }),
    ),
  )
  const [first, pending, buyer, other] = users
  const category = await database.category.create({
    data: { name: 'Ấm chén test', slug: 'test-' + first.id },
  })
  const [studio, draft, secondStudio] = await Promise.all(
    [first, pending, other].map((user, index) =>
      database.workshop.create({
        data: {
          name: 'Xưởng gốm test ' + index,
          slug: 'test-' + user.id,
          address: 'Bát Tràng',
          ownerId: user.id,
          status: index === 1 ? 'PENDING' : 'APPROVED',
          categories: { create: { categoryId: category.id } },
        },
      }),
    ),
  )
  const repository = workshopRepository(database)
  const media = createMedia(directory, 1)
  const server = createApp({
    repository,
    products: productRepository(database),
    milestones: milestoneImageRepository(database),
    batches: batchRepository(database),
    journal: milestoneRepository(database),
    media,
    origin,
    installSession: (app) =>
      installDemoSession(app, {
        password,
        secret: 'one-off-test-secret-at-least-32-characters',
        lookupUser: repository.lookupUser,
      }),
    supplementalRoutes: demoDataRoutes({ repository, origin, requireArtisan }),
  }).listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve))
    await database.productionBatch.deleteMany({ where: { workshopId: studio.id } })
    await database.product.deleteMany({
      where: { workshopId: { in: [studio.id, secondStudio.id] } },
    })
    await database.workshop.deleteMany({
      where: { id: { in: [studio.id, draft.id, secondStudio.id] } },
    })
    await database.category.delete({ where: { id: category.id } })
    await database.user.deleteMany({ where: { id: { in: users.map(({ id }) => id) } } })
    await database.$disconnect()
    await rm(directory, { recursive: true, force: true })
  })
  const endpoint = 'http://127.0.0.1:' + server.address().port
  const send = (path, { method = 'GET', body, cookie, originHeader = origin } = {}) =>
    fetch(endpoint + path, {
      method,
      headers: {
        Origin: originHeader,
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      },
      body: !body || body instanceof FormData ? body : JSON.stringify(body),
    })
  const login = async (email) => {
    const response = await send('/api/demo/session', { method: 'POST', body: { email, password } })
    assert.equal(response.status, 200)
    const cookie = response.headers.get('set-cookie')
    assert.match(cookie, /HttpOnly/)
    return cookie.split(';')[0]
  }
  const owner = await login(first.email)
  const waiting = await login(pending.email)
  const customer = await login(buyer.email)
  const anotherOwner = await login(other.email)
  const profile = '/api/me/workshop'
  const gallery = profile + '/images'
  const certificates = profile + '/certificates'
  const goodPhoto = await sharp({
    create: { width: 900, height: 600, channels: 3, background: '#123456' },
  })
    .png()
    .toBuffer()
  const goodFile = new Blob([goodPhoto], { type: 'image/png' })

  await t.test(
    'đúng owner, trường công khai giới hạn, PENDING chỉnh được, sai Origin bị chặn',
    async () => {
      assert.equal((await send(profile)).status, 401)
      assert.equal((await send(profile, { cookie: customer })).status, 403)
      assert.equal(
        (
          await send(profile, {
            method: 'PATCH',
            cookie: waiting,
            originHeader: 'https://other.invalid',
            body: { history: 'Sai origin' },
          })
        ).status,
        403,
      )
      assert.equal((await send('/api/workshops/' + draft.slug)).status, 404)
      assert.equal(
        (await send(profile, { method: 'PATCH', cookie: waiting, body: { ownerId: first.id } }))
          .status,
        400,
      )
      const edit = await send(profile, {
        method: 'PATCH',
        cookie: waiting,
        body: {
          history: 'Lịch sử xưởng chờ duyệt',
          categoryIds: [category.id],
          isOpenForVisit: true,
          openingHours: {
            mon: [
              ['08:00', '12:00'],
              ['11:00', '15:00'],
            ],
          },
        },
      })
      assert.equal(edit.status, 400)
      assert.equal((await edit.json()).error.details[0].field, 'openingHours.mon')
      const saved = await send(profile, {
        method: 'PATCH',
        cookie: waiting,
        body: {
          history: 'Lịch sử riêng',
          openingHours: { mon: [['08:00', '12:00']] },
          isOpenForVisit: true,
        },
      })
      assert.equal(saved.status, 200)
      const { data } = await (await send('/api/workshops/' + studio.slug)).json()
      assert.equal(data.ownerId, undefined)
      assert.equal(data.rejectionReason, undefined)
      assert.notEqual(data.history, 'Lịch sử riêng')
    },
  )

  await t.test(
    'upload nguyên tử, ảnh được thu nhỏ, chứng nhận chỉ nhận ảnh và theo quyền xưởng',
    async () => {
      const invalid = new Blob(['not a PNG'], { type: 'image/png' })
      const mixed = new FormData()
      mixed.append('images', goodFile, 'one.png')
      mixed.append('images', invalid, 'spoof.png')
      assert.equal(
        (await send(gallery, { method: 'POST', cookie: waiting, body: mixed })).status,
        415,
      )
      assert.deepEqual(await readdir(directory), ['.staging'])
      const oversized = new FormData()
      oversized.append('images', new Blob([Buffer.alloc(1024 * 1024 + 1)]), 'big.png')
      assert.equal(
        (await send(gallery, { method: 'POST', cookie: waiting, body: oversized })).status,
        413,
      )

      const photo = new FormData()
      photo.append('images', goodFile, 'real.png')
      photo.append('altText[]', 'Ảnh gốm test')
      const uploaded = await send(gallery, { method: 'POST', cookie: waiting, body: photo })
      assert.equal(uploaded.status, 201)
      const {
        data: [item],
      } = await uploaded.json()
      assert.equal(item.altText, 'Ảnh gốm test')
      assert.equal((await send(item.thumbUrl)).status, 404)
      assert.equal((await send(item.thumbUrl, { cookie: owner })).status, 404)
      const thumbnail = await send(item.thumbUrl, { cookie: waiting })
      assert.equal(thumbnail.status, 200)
      assert.equal((await sharp(Buffer.from(await thumbnail.arrayBuffer())).metadata()).width, 400)
      assert.equal(
        (await send(gallery + '/' + item.id, { method: 'DELETE', cookie: owner })).status,
        404,
      )

      for (const [file, name, status] of [
        [new Blob(['%PDF-1.4']), 'certificate.pdf', 415],
        [goodFile, 'certificate.png', 201],
      ]) {
        const body = new FormData()
        body.append('title', 'Chứng nhận test')
        body.append('issuer', 'Đơn vị cấp')
        body.append('file', file, name)
        const res = await send(certificates, { method: 'POST', cookie: waiting, body })
        assert.equal(res.status, status)
        if (status === 201) {
          const { data } = await res.json()
          assert.equal((await send(data.fileUrl)).status, 404)
          assert.equal((await send(data.fileUrl, { cookie: waiting })).status, 200)
          assert.equal(
            (await send(certificates + '/' + data.id, { method: 'DELETE', cookie: waiting }))
              .status,
            204,
          )
        }
      }
      assert.equal(
        (await send(gallery + '/' + item.id, { method: 'DELETE', cookie: waiting })).status,
        204,
      )
      assert.deepEqual(await readdir(directory), ['.staging'])
    },
  )

  await t.test(
    'khóa ghép lô-sản phẩm, ảnh đại diện duy nhất, mốc có thứ tự và QR theo lô',
    async () => {
      const products = await database.product.createManyAndReturn({
        data: [1, 2].map((index) => ({
          workshopId: studio.id,
          categoryId: category.id,
          name: 'Mẫu ' + index,
          slug: studio.slug + '-' + index,
          status: 'VISIBLE',
          price: 123000,
        })),
      })
      const batch = await database.productionBatch.create({
        data: {
          name: 'Lô test',
          workshopId: studio.id,
          batchCode: studio.slug,
          isPublic: true,
          products: {
            create: products.map(({ id }, index) => ({ productId: id, quantity: index + 1 })),
          },
        },
      })
      const link = { batchId: batch.id, productId: products[0].id }
      await assert.rejects(database.batchProduct.create({ data: { ...link, quantity: 3 } }))
      await assert.rejects(
        database.batchProduct.update({ where: { batchId_productId: link }, data: { quantity: 0 } }),
      )
      const marker = { batchId: batch.id, orderIndex: 0, title: 'Vuốt gốm', updatedById: first.id }
      await database.productionMilestone.create({ data: marker })
      await assert.rejects(database.productionMilestone.create({ data: marker }))
      const cover = {
        productId: products[0].id,
        isPrimary: true,
        imageUrl: '/placeholder.webp',
        thumbUrl: '/placeholder-thumb.webp',
      }
      await database.productImage.create({ data: cover })
      await assert.rejects(database.productImage.create({ data: cover }))

      const { data } = await (await send('/api/trace/' + batch.batchCode)).json()
      assert.equal(data.products.length, 2)
      assert.equal(data.milestones[0].title, 'Vuốt gốm')
      const qr = '/api/me/batches/' + batch.id + '/qr'
      assert.equal((await send(qr, { cookie: waiting })).status, 404)
      const png = await send(qr, { cookie: owner })
      assert.equal(png.status, 200)
      assert.match(png.headers.get('content-type'), /^image\/png/)
      const svg = await send(qr + '?format=svg', { cookie: owner })
      assert.equal(svg.status, 200)
      assert.match(svg.headers.get('content-type'), /^image\/svg/)
    },
  )
  await t.test('tuần 2: CRUD, slug, phân quyền và lọc catalog', async () => {
    const stem = '/api/me/products'
    const body = {
      name: 'Bình Đất Tuần Hai',
      categoryId: category.id,
      price: '1200.25',
      description: 'Trang trí',
      specifications: { 'Chất liệu': 'Gốm' },
    }
    const sendPost = (cookie, fields = body) => send(stem, { method: 'POST', cookie, body: fields })
    assert.equal((await sendPost(null)).status, 401)
    assert.equal((await sendPost(waiting)).status, 403)
    assert.equal((await sendPost(customer)).status, 403)
    assert.equal((await sendPost(owner, { ...body, categoryId: first.id })).status, 400)
    assert.equal((await sendPost(owner, { ...body, price: '1200.999' })).status, 400)
    const created = await sendPost(owner)
    assert.equal(created.status, 201)
    const { data: firstProduct } = await created.json()
    const { data: secondProduct } = await (await sendPost(owner, { ...body, price: '9999' })).json()
    assert.equal(firstProduct.slug, 'binh-dat-tuan-hai')
    assert.notEqual(secondProduct.slug, firstProduct.slug)
    assert.equal(firstProduct.status, 'HIDDEN')
    const url = stem + '/' + firstProduct.id
    const publicUrl = '/api/products/' + firstProduct.slug
    const patch = (fields) => send(url, { method: 'PATCH', cookie: owner, body: fields })
    assert.equal((await send(url, { cookie: anotherOwner })).status, 404)
    assert.equal(
      (await send(url, { method: 'PATCH', cookie: anotherOwner, body: { name: 'Tên khác' } }))
        .status,
      404,
    )
    assert.equal((await send(url, { method: 'DELETE', cookie: anotherOwner })).status, 404)
    assert.equal((await send(publicUrl)).status, 404)
    assert.equal((await patch({ status: 'VISIBLE' })).status, 409)
    const renamed = await patch({ name: 'Bình Đất mới' })
    assert.equal((await renamed.json()).data.slug, firstProduct.slug)
    const makeForm = () => {
      const files = new FormData()
      files.append('images', goodFile, 'one.png')
      files.append('images', goodFile, 'two.png')
      return files
    }
    assert.equal(
      (await send(url + '/images', { method: 'POST', body: makeForm(), cookie: anotherOwner }))
        .status,
      404,
    )
    const uploaded = await send(url + '/images', {
      method: 'POST',
      body: makeForm(),
      cookie: owner,
    })
    assert.equal(uploaded.status, 201)
    const {
      data: [one, two],
    } = await uploaded.json()
    assert.equal(one.isPrimary, true)
    assert.equal((await send(one.thumbUrl)).status, 404)
    assert.equal((await send(one.thumbUrl, { cookie: owner })).status, 200)
    assert.equal((await patch({ status: 'VISIBLE' })).status, 200)
    assert.equal((await send(one.thumbUrl)).status, 200)
    assert.equal((await send(publicUrl)).status, 200)
    assert.equal(
      (
        await send(url + '/images/order', {
          method: 'PATCH',
          cookie: owner,
          body: { ids: [two.id, one.id] },
        })
      ).status,
      200,
    )
    const primary = await send(url + '/images/' + two.id + '/primary', {
      method: 'PATCH',
      cookie: owner,
    })
    assert.equal(primary.status, 200)
    assert.equal((await primary.json()).data.filter((entry) => entry.isPrimary)[0].id, two.id)
    const params = new URLSearchParams({
      q: 'Bình',
      workshop: studio.slug,
      categoryId: category.id,
      minPrice: '1200',
      maxPrice: '1201',
      sort: 'price',
      page: '1',
      limit: '1',
    })
    const catalog = await (await send('/api/products?' + params)).json()
    assert.equal(catalog.meta.total, 1)
    assert.equal(catalog.data[0].price, '1200.25')
    assert.equal(catalog.data[0].images[0].thumbUrl, two.thumbUrl)
    assert.equal(catalog.data[0].images[0].imageUrl, undefined)
    params.set('page', '2')
    assert.equal((await (await send('/api/products?' + params)).json()).data.length, 0)
    assert.equal((await send('/api/products?minPrice=2&maxPrice=1')).status, 400)
    const workshops = await (await send('/api/workshops/suggest?q=Xưởng')).json()
    assert(workshops.data.some(({ slug }) => slug === studio.slug))
    assert(!workshops.data.some(({ slug }) => slug === draft.slug))
    const batch = await database.productionBatch.create({
      data: {
        name: 'Lô kiểm tra tuần 2',
        batchCode: 'T2-' + studio.id,
        workshopId: studio.id,
        isPublic: true,
        products: { create: { productId: firstProduct.id, quantity: 4 } },
      },
    })
    assert.equal((await (await send(publicUrl)).json()).data.batches[0].batchCode, batch.batchCode)
    assert.equal((await send(url, { method: 'DELETE', cookie: owner })).status, 409)
    assert.equal(
      (await send(url + '/images/' + two.id, { method: 'DELETE', cookie: owner })).status,
      204,
    )
    assert.equal((await send(two.thumbUrl)).status, 404)
    assert(!(await readdir(directory)).includes(two.thumbUrl.split('/').at(-1)))
    assert.equal(
      (await send(url + '/images/' + one.id, { method: 'DELETE', cookie: owner })).status,
      409,
    )
    assert.equal((await patch({ status: 'HIDDEN' })).status, 200)
    assert.equal((await send(publicUrl)).status, 404)
    assert.equal(
      (await send(stem + '/' + secondProduct.id, { method: 'DELETE', cookie: owner })).status,
      204,
    )
  })

  await t.test('tuần 2: ảnh mốc sử dụng cùng pipeline và quyền lô', async () => {
    const batch = await database.productionBatch.create({
      data: {
        name: 'Lô riêng',
        batchCode: 'PRI-' + studio.id,
        workshopId: studio.id,
        isPublic: false,
      },
    })
    const milestone = await database.productionMilestone.create({
      data: { batchId: batch.id, orderIndex: 0, title: 'Nung', updatedById: first.id },
    })
    const path = '/api/me/milestones/' + milestone.id + '/images'
    assert.equal((await send(path, { cookie: anotherOwner })).status, 404)
    const form = new FormData()
    form.append('images', goodFile, 'first.png')
    form.append('images', goodFile, 'second.png')
    const response = await send(path, { method: 'POST', cookie: owner, body: form })
    assert.equal(response.status, 201)
    const { data } = await response.json()
    assert.equal(data.length, 2)
    assert.equal((await send(data[0].imageUrl)).status, 404)
    assert.equal((await send(data[0].imageUrl, { cookie: owner })).status, 200)
    await database.productionBatch.update({ where: { id: batch.id }, data: { isPublic: true } })
    assert.equal((await send(data[0].thumbUrl)).status, 200)
    assert.equal(
      (await send(path + '/' + data[0].id, { method: 'DELETE', cookie: anotherOwner })).status,
      404,
    )
    assert.equal(
      (await send(path + '/' + data[0].id, { method: 'DELETE', cookie: owner })).status,
      204,
    )
    assert.equal((await send(data[0].thumbUrl)).status, 404)
  })
  await t.test('tuần 3: lô, nhật ký có quyền và thứ tự, QR và truy xuất công khai', async () => {
    const { data: product } = await (
      await send('/api/me/products', {
        method: 'POST',
        cookie: owner,
        body: { name: 'Sản phẩm lô tuần 3', categoryId: category.id },
      })
    ).json()
    const { data: foreign } = await (
      await send('/api/me/products', {
        method: 'POST',
        cookie: anotherOwner,
        body: { name: 'Sản phẩm xưởng khác tuần 3', categoryId: category.id },
      })
    ).json()
    const base = '/api/me/batches'
    const body = { name: 'Lô tuần 3', products: [{ productId: product.id, quantity: 5 }] }
    const post = (cookie, fields) => send(base, { method: 'POST', cookie, body: fields })
    assert.equal((await post(waiting, body)).status, 403)
    assert.equal(
      (await post(owner, { ...body, products: [...body.products, ...body.products] })).status,
      400,
    )
    assert.equal(
      (await post(owner, { ...body, products: [{ productId: foreign.id, quantity: 1 }] })).status,
      400,
    )

    const response = await post(owner, body)
    assert.equal(response.status, 201)
    const { data: batch } = await response.json()
    assert.match(batch.batchCode, /^BT-[A-F0-9]{12}$/)
    assert.equal(batch.status, 'PLANNED')
    assert.equal(batch.products[0].quantity, 5)
    const endpoint = base + '/' + batch.id
    const trace = '/api/trace/' + batch.batchCode
    assert.equal((await send(endpoint, { cookie: anotherOwner })).status, 404)
    assert.equal((await send(trace)).status, 404)
    assert.equal((await send('/api/trace/khong.co.ma')).status, 404)
    const list = await (await send(base + '?status=PLANNED&limit=1', { cookie: owner })).json()
    assert.equal(list.data[0].id, batch.id)

    const createEntry = (cookie, fields) =>
      send(endpoint + '/milestones', { method: 'POST', cookie, body: fields })
    assert.equal((await createEntry(anotherOwner, { title: 'Mốc trái quyền' })).status, 404)
    assert.equal(
      (await createEntry(owner, { title: 'Mốc sai', occurredAt: '2026-99-99' })).status,
      400,
    )
    const { data: one } = await (await createEntry(owner, { title: 'Nặn dáng' })).json()
    const { data: two } = await (
      await createEntry(owner, { title: 'Nung', occurredAt: '2026-11-23T10:00:00+07:00' })
    ).json()
    assert.equal(one.updatedById, first.id)
    assert.equal(one.occurredAt, null)
    assert.equal(two.occurredAt, '2026-11-23T03:00:00.000Z')
    const milePath = '/api/me/milestones/' + one.id
    assert.equal(
      (
        await send(milePath, {
          method: 'PATCH',
          cookie: anotherOwner,
          body: { title: 'Sửa trái quyền' },
        })
      ).status,
      404,
    )
    const edited = await send(milePath, {
      method: 'PATCH',
      cookie: owner,
      body: { title: 'Tạo dáng' },
    })
    assert.equal((await edited.json()).data.title, 'Tạo dáng')
    const order = endpoint + '/milestones/order'
    assert.equal(
      (await send(order, { method: 'PATCH', cookie: owner, body: { ids: [one.id] } })).status,
      409,
    )
    const reordered = await send(order, {
      method: 'PATCH',
      cookie: owner,
      body: { ids: [two.id, one.id] },
    })
    assert.deepEqual(
      (await reordered.json()).data.map((item) => item.id),
      [two.id, one.id],
    )

    const photo = new FormData()
    photo.append('images', goodFile, 'batch-proof.png')
    const uploaded = await send(milePath + '/images', {
      method: 'POST',
      cookie: owner,
      body: photo,
    })
    assert.equal(uploaded.status, 201)
    const {
      data: [image],
    } = await uploaded.json()
    assert.equal((await send(image.thumbUrl)).status, 404)
    const published = await send(endpoint, {
      method: 'PATCH',
      cookie: owner,
      body: { isPublic: true, status: 'IN_PROGRESS' },
    })
    assert.equal(published.status, 200)
    assert((await published.json()).data.startedAt)
    assert.equal((await send(endpoint, { method: 'DELETE', cookie: owner })).status, 409)
    const { data: publicBatch } = await (await send(trace)).json()
    assert.equal(publicBatch.id, undefined)
    assert.equal(publicBatch.workshop.id, undefined)
    assert.deepEqual(publicBatch.products, [])
    assert.deepEqual(
      publicBatch.milestones.map((item) => item.title),
      ['Nung', 'Tạo dáng'],
    )
    assert.equal(publicBatch.milestones[1].updatedById, undefined)
    assert.equal(publicBatch.milestones[1].occurredAt, null)
    assert.equal(publicBatch.milestones[1].description, null)
    assert.deepEqual(publicBatch.milestones[0].images, [])
    assert.equal(publicBatch.milestones[1].images[0].id, undefined)
    assert.equal((await send(image.thumbUrl)).status, 200)
    const png = await send(endpoint + '/qr?format=png&download=1', { cookie: owner })
    assert.match(png.headers.get('content-disposition'), /attachment/)
    assert.match(png.headers.get('content-type'), /image\/png/)
    assert.equal((await send(endpoint + '/qr', { cookie: anotherOwner })).status, 404)

    assert.equal((await send(milePath, { method: 'DELETE', cookie: owner })).status, 204)
    assert(!(await readdir(directory)).includes(image.thumbUrl.split('/').at(-1)))
    assert.equal(
      (await send(endpoint, { method: 'PATCH', cookie: owner, body: { isPublic: false } })).status,
      200,
    )
    assert.equal((await send(trace)).status, 404)
    await database.product.delete({ where: { id: foreign.id } })
  })
})
