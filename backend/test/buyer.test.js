import { buyerRepository } from '../src/modules/buyer/buyer.repository.js'
import { createMedia } from '../src/modules/media/media.service.js'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { request } from 'node:http'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'
import { createApp } from '../src/app.js'
import { installAuth } from '../src/modules/auth/auth.js'
import { buyerRoutes } from '../src/modules/buyer/buyer.routes.js'
import { draft, patch, checkDates } from '../src/modules/buyer/buyer.schema.js'
import { ordersService } from '../src/modules/buyer/orders.service.js'
import {
  connectDatabase,
  workshopRepository,
} from '../src/modules/workshops/workshops.repository.js'

const day = 86400000
const sample = (categoryId) => ({
  title: 'Đặt cốc gốm',
  description: 'Cốc men lam',
  categoryId,
  quantity: 100,
  unit: 'chiếc',
  budgetMax: '1500.50',
  deliveryAddress: 'Hà Nội',
  bidDeadline: new Date(Date.now() + day).toISOString(),
  requiredBy: new Date(Date.now() + 7 * day).toISOString().slice(0, 10),
})
test('RFQ kiểm tra dữ liệu đầu vào và cập nhật từng trường', () => {
  const value = sample(randomUUID())
  assert.equal(draft.parse(value).budgetMax, '1500.50')
  for (const invalid of [
    { quantity: 0 },
    { quantity: 1.5 },
    { budgetMax: '1.234' },
    { status: 'DELIVERED' },
    { buyerId: randomUUID() },
  ]) {
    assert.equal(draft.safeParse({ ...value, ...invalid }).success, false)
  }
  assert.deepEqual(patch.parse({ contactName: '  Test  ' }), { contactName: 'Test' })
  assert.equal(patch.safeParse({}).success, false)
  assert.throws(() => checkDates({ ...value, bidDeadline: '2020-01-01T00:00:00Z' }))
  assert.throws(() => checkDates({ ...value, requiredBy: value.bidDeadline.slice(0, 10) }))
})

const url = process.env.VCRAFT_TEST_DATABASE_URL
test('Buyer qua HTTP và PostgreSQL', { skip: !url }, async (t) => {
  const db = connectDatabase(url)
  const tag = randomUUID(),
    origin = 'http://buyer.test'
  const socketPath =
    process.platform === 'win32'
      ? '//./pipe/vcraft-test-' + tag
      : join(tmpdir(), 'vcraft-' + tag + '.sock')
  let store
  const server = createApp({
    repository: workshopRepository(db),
    media: createMedia(tmpdir(), 1),
    origin,
    supplementalRoutes: buyerRoutes(db),
    installSession: (app) => {
      store = installAuth(app, { db, connectionString: url, secret: randomUUID(), secure: false })
    },
  }).listen(socketPath)
  await new Promise((resolve, reject) => server.once('listening', resolve).once('error', reject))
  const users = [],
    categories = [],
    studios = [],
    rfqs = []
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve))
    await store.close()
    await db.order.deleteMany({ where: { rfqId: { in: rfqs } } })
    await db.allocationPlan.deleteMany({ where: { rfqId: { in: rfqs } } })
    await db.bid.deleteMany({ where: { rfqId: { in: rfqs } } })
    await db.rfq.deleteMany({ where: { id: { in: rfqs } } })
    await db.workshop.deleteMany({ where: { id: { in: studios } } })
    await db.category.deleteMany({ where: { id: { in: categories } } })
    await db.session.deleteMany({
      where: { OR: users.map((userId) => ({ sess: { path: ['userId'], equals: userId } })) },
    })
    await db.user.deleteMany({ where: { id: { in: users } } })
    await db.$disconnect()
  })
  const call = (method, path, cookie, body, source = origin) =>
    new Promise((resolve, reject) => {
      const req = request(
        {
          method,
          path: '/api' + path,
          socketPath,
          headers: {
            Origin: source,
            ...(cookie ? { Cookie: cookie } : {}),
            ...(body ? { 'Content-Type': 'application/json' } : {}),
          },
        },
        (res) => {
          let data = ''
          res.setEncoding('utf8')
          res
            .on('data', (s) => {
              data += s
            })
            .on('end', () =>
              resolve({
                status: res.statusCode,
                ...(data ? JSON.parse(data) : {}),
                cookie: res.headers['set-cookie']?.[0],
              }),
            )
        },
      )
      req.on('error', reject)
      req.end(body ? JSON.stringify(body) : undefined)
    })
  const password = randomUUID()
  async function account(prefix, role = 'BUYER') {
    const email = prefix + '-' + tag + '@example.test',
      profile = { email, password, fullName: prefix, phone: '0900000000' }
    const signup = await call('POST', '/auth/register', null, profile)
    assert.equal(signup.status, 201)
    users.push(signup.data.id)
    assert.equal((await call('POST', '/auth/register', null, profile)).status, 409)
    if (role !== 'BUYER') await db.user.update({ where: { id: signup.data.id }, data: { role } })
    const login = await call('POST', '/auth/login', null, { email, password })
    assert.equal(login.status, 200)
    assert.match(login.cookie, /HttpOnly/)
    return { id: signup.data.id, cookie: login.cookie.split(';')[0] }
  }
  const a = await account('An'),
    b = await account('Binh'),
    artisan = await account('Tho', 'ARTISAN')
  const admin = await db.user.create({
    data: {
      fullName: 'Fixture',
      email: 'admin-' + tag + '@example.test',
      role: 'ADMIN',
      passwordHash: 'unused',
    },
  })
  users.push(admin.id)
  const addCategory = async (name) => {
    const c = await db.category.create({ data: { name, slug: name + tag } })
    categories.push(c.id)
    return c.id
  }
  const category = await addCategory('gom'),
    empty = await addCategory('khac')
  const studio = await db.workshop.create({
    data: {
      ownerId: artisan.id,
      name: 'Test',
      slug: tag,
      address: 'HN',
      status: 'APPROVED',
      categories: { create: { categoryId: category } },
    },
  })
  studios.push(studio.id)
  async function addStudio(label, settings) {
    const owner = await db.user.create({
      data: {
        email: label + tag + '@example.test',
        role: 'ARTISAN',
        passwordHash: 'unused',
        fullName: label,
      },
    })
    users.push(owner.id)
    const result = await db.workshop.create({
      data: {
        ownerId: owner.id,
        name: label,
        slug: label + tag,
        address: 'Huế',
        status: 'APPROVED',
        categories: { create: { categoryId: category } },
        ...settings,
      },
    })
    studios.push(result.id)
    return result
  }
  const second = await addStudio('second', {})
  await addStudio('pending', { status: 'PENDING' })
  await addStudio('closed', { acceptsOrders: false })
  let id, plan, order
  await t.test('Phiên, quyền sở hữu, nháp, matching và gửi lặp', async () => {
    assert.equal((await call('GET', '/rfqs')).status, 401)
    assert.equal((await call('GET', '/rfqs', artisan.cookie)).status, 403)
    assert.equal(
      (await call('POST', '/rfqs', a.cookie, sample(empty), 'http://elsewhere.test')).status,
      403,
    )
    const created = await call('POST', '/rfqs', a.cookie, sample(empty))
    assert.equal(created.status, 201)
    id = created.data.id
    rfqs.push(id)
    assert.equal(created.data.budgetMax, '1500.50')
    assert.match(created.data.requiredBy, /^\d{4}-\d{2}-\d{2}$/)
    assert.equal(created.data.contactName, 'An')
    assert.equal(created.data.contactPhone, '0900000000')
    assert.equal((await call('GET', '/rfqs/' + id, b.cookie)).status, 404)
    assert.equal((await call('PATCH', '/rfqs/' + id, b.cookie, { title: 'X' })).status, 404)
    assert.equal((await call('POST', '/rfqs/' + id + '/send', a.cookie)).status, 422)
    assert.equal((await call('GET', '/rfqs/' + id, a.cookie)).data.status, 'DRAFT')
    assert.equal(
      (await call('PATCH', '/rfqs/' + id, a.cookie, { categoryId: category })).status,
      200,
    )
    assert.equal((await call('POST', '/rfqs/' + id + '/send', a.cookie)).data.invitedCount, 2)
    assert.equal((await call('POST', '/rfqs/' + id + '/send', a.cookie)).status, 409)
    assert.equal((await call('PATCH', '/rfqs/' + id, a.cookie, { quantity: 42 })).status, 409)
    assert.equal(
      (await call('PATCH', '/rfqs/' + id, a.cookie, { deliveryAddress: 'Huế' })).status,
      200,
    )
    assert.equal((await call('GET', '/rfqs?status=SENT', b.cookie)).data.length, 0)
  })
  async function offer() {
    await db.rfq.update({ where: { id }, data: { status: 'BIDDING' } })
    const items = []
    for (const [workshopId, quantity] of [
      [studio.id, 60],
      [second.id, 40],
    ]) {
      const bid = await db.bid.upsert({
        where: { rfqId_workshopId: { rfqId: id, workshopId } },
        update: { lockedAt: new Date() },
        create: {
          rfqId: id,
          workshopId,
          quantityOffered: quantity,
          unitPrice: '12.34',
          leadTimeDays: 2,
          lockedAt: new Date(),
        },
      })
      items.push({
        bidId: bid.id,
        workshopId,
        quantity,
        unitPrice: bid.unitPrice,
        lineTotal: bid.unitPrice.mul(quantity),
        dueDate: new Date(Date.now() + day),
      })
    }
    await db.rfqInvitation.updateMany({ where: { rfqId: id }, data: { status: 'BID_SUBMITTED' } })
    return db.allocationPlan.create({
      data: {
        rfqId: id,
        createdById: admin.id,
        status: 'PENDING_BUYER',
        sentAt: new Date(),
        totalQuantity: 100,
        totalAmount: '1234',
        items: { create: items },
      },
    })
  }
  await t.test('Chỉ chủ RFQ được duyệt hoặc từ chối, từ chối mở khóa bid', async () => {
    const p = await offer()
    assert.deepEqual(
      (await call('GET', '/rfqs/' + id + '/bids', a.cookie)).data.map((b) => b.lineTotal).sort(),
      ['493.60', '740.40'],
    )
    assert.equal((await call('POST', '/plans/' + p.id + '/accept', b.cookie)).status, 404)
    assert.equal(
      (
        await call('POST', '/plans/' + p.id + '/reject', a.cookie, {
          reason: 'Điều chỉnh hạn giao',
        })
      ).data.rejectReason,
      'Điều chỉnh hạn giao',
    )
    assert.equal((await db.bid.findFirst({ where: { rfqId: id } })).lockedAt, null)
    assert.equal((await call('POST', '/plans/' + p.id + '/accept', a.cookie)).status, 409)
    plan = await offer()
  })
  await t.test('Lỗi khi tạo nhiệm vụ hoàn tác cả phương án, RFQ và đơn', async () => {
    const broken = db.$extends({
      query: {
        productionTask: {
          createMany() {
            throw new Error('test task failure')
          },
        },
      },
    })
    await assert.rejects(
      ordersService(buyerRepository(broken)).accept(a.id, plan.id),
      /test task failure/,
    )
    assert.equal(await db.order.count({ where: { rfqId: id } }), 0)
    assert.equal((await db.rfq.findUnique({ where: { id } })).status, 'BIDDING')
    assert.equal(
      (await db.allocationPlan.findUnique({ where: { id: plan.id } })).status,
      'PENDING_BUYER',
    )
  })
  await t.test('Hai lần duyệt đồng thời tạo đúng một đơn và một bộ nhiệm vụ', async () => {
    const responses = await Promise.all(
      [1, 2].map(() => call('POST', '/plans/' + plan.id + '/accept', a.cookie)),
    )
    assert.deepEqual(responses.map((r) => r.status).sort(), [200, 201])
    assert.equal(responses[0].data.order.id, responses[1].data.order.id)
    assert.deepEqual(responses.map((r) => r.data.alreadyProcessed).sort(), [false, true])
    order = responses[0].data.order
    assert.equal(await db.productionTask.count({ where: { orderId: order.id } }), 2)
  })
  await t.test('Tiến độ, xác nhận nhận hàng, kết thúc phiên', async () => {
    assert.equal((await call('GET', '/orders/' + order.id, b.cookie)).status, 404)
    assert.equal(
      (await call('POST', '/orders/' + order.id + '/confirm-received', a.cookie)).status,
      409,
    )
    await db.productionTask.updateMany({
      where: { orderId: order.id, workshopId: studio.id },
      data: { completedQuantity: 60, status: 'COMPLETED' },
    })
    assert.deepEqual((await call('GET', '/orders/' + order.id, a.cookie)).data.progress, {
      completedQuantity: 60,
      quantity: 100,
    })
    assert.equal(
      (await call('POST', '/orders/' + order.id + '/confirm-received', a.cookie)).status,
      409,
    )
    await db.productionTask.updateMany({
      where: { orderId: order.id, workshopId: second.id },
      data: { completedQuantity: 40, status: 'COMPLETED' },
    })
    await db.order.update({ where: { id: order.id }, data: { status: 'READY' } })
    await db.rfq.update({ where: { id }, data: { status: 'IN_PRODUCTION' } })
    assert.deepEqual((await call('GET', '/orders/' + order.id, a.cookie)).data.progress, {
      completedQuantity: 100,
      quantity: 100,
    })
    assert.equal(
      (await call('POST', '/orders/' + order.id + '/confirm-received', b.cookie)).status,
      404,
    )
    assert.equal(
      (await call('POST', '/orders/' + order.id + '/confirm-received', artisan.cookie)).status,
      403,
    )
    assert.equal(
      (await call('POST', '/orders/' + order.id + '/confirm-received', a.cookie)).data.status,
      'DELIVERED',
    )
    assert.equal((await call('GET', '/rfqs/' + id, a.cookie)).data.status, 'DELIVERED')
    assert.equal((await call('POST', '/auth/logout', a.cookie)).status, 204)
    assert.equal((await call('GET', '/auth/me', a.cookie)).status, 401)
  })
})
