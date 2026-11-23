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

test('N2 tuần 1: API hồ sơ, upload, schema và QR trên PostgreSQL', { skip: !url }, async (t) => {
  const database = connectDatabase(url)
  const directory = await mkdtemp(join(tmpdir(), 'vcraft-n2-test-'))
  const users = await Promise.all(
    ['ARTISAN', 'ARTISAN', 'BUYER'].map((role, index) =>
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
  const [first, pending, buyer] = users
  const category = await database.category.create({
    data: { name: 'Ấm chén test', slug: 'test-' + first.id },
  })
  const [studio, draft] = await Promise.all(
    [first, pending].map((user, index) =>
      database.workshop.create({
        data: {
          name: 'Xưởng gốm test ' + index,
          slug: 'test-' + user.id,
          address: 'Bát Tràng',
          ownerId: user.id,
          status: index ? 'PENDING' : 'APPROVED',
          categories: { create: { categoryId: category.id } },
        },
      }),
    ),
  )
  const repository = workshopRepository(database)
  const media = createMedia(directory, 1)
  const server = createApp({
    repository,
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
    await database.product.deleteMany({ where: { workshopId: studio.id } })
    await database.workshop.deleteMany({ where: { id: { in: [studio.id, draft.id] } } })
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
})
