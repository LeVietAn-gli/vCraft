/** Re-runnable demo seed. Use ONLY with a disposable local database, never production. */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { slugify } from '../src/utils/code.js';

const prisma = new PrismaClient();
const day = 86400000;
const inDays = (n) => new Date(Date.now() + day * n);
const dateOnly = (n) => new Date(inDays(n).toISOString().slice(0, 10) + 'T00:00:00.000Z');
const demoPassword = 'Demo@2026!';
const categoriesSeed = [
  ['Gốm gia dụng', 'gom-gia-dung'], ['Bình và lọ gốm', 'binh-va-lo-gom'],
  ['Ấm chén', 'am-chen'], ['Quà tặng thủ công', 'qua-tang-thu-cong'],
];
const workshopSeed = [
  { slug: 'gom-minh-duc', name: 'Gốm Minh Đức', owner: 'nghe.nhan01@vcraft.demo', lat: 20.97875, lng: 105.9112, image: 'vase-blue.svg', cat: [0, 1, 3] },
  { slug: 'gom-an-phuc', name: 'Gốm An Phúc', owner: 'nghe.nhan02@vcraft.demo', lat: 20.9802, lng: 105.9124, image: 'teapot.svg', cat: [0, 2, 3] },
  { slug: 'gom-hong-lien', name: 'Gốm Hồng Liên', owner: 'nghe.nhan03@vcraft.demo', lat: 20.9774, lng: 105.9136, image: 'bowl.svg', cat: [0, 1, 2] },
  { slug: 'lo-gom-phu-thanh', name: 'Lò gốm Phú Thành', owner: 'nghe.nhan04@vcraft.demo', lat: 20.9792, lng: 105.9101, image: 'vase-blue.svg', cat: [0, 2, 3] },
  { slug: 'gom-hoa-binh', name: 'Gốm Hòa Bình', owner: 'nghe.nhan05@vcraft.demo', lat: 20.9768, lng: 105.9096, image: 'teapot.svg', cat: [0, 1, 3] },
  { slug: 'vuon-gom-que-huong', name: 'Vườn Gốm Quê Hương', owner: 'nghe.nhan06@vcraft.demo', lat: 20.9810, lng: 105.9143, image: 'bowl.svg', cat: [0, 1, 2, 3] },
];
const images = ['bowl.svg', 'teapot.svg', 'vase-blue.svg'];
const names = ['Cốc sứ tráng men', 'Bình gốm họa tiết sen', 'Bộ ấm trà thủ công', 'Bát gốm men ngọc', 'Bình hoa men lam'];
const thumb = (file) => `/items/${file}`;
async function user(email, fullName, role, passwordHash) {
  return prisma.user.upsert({ where: { email }, update: {}, create: { email, fullName, role, passwordHash, phone: '0900000000' } });
}
async function ensureInvitations(rfq, workshops) {
  await prisma.rfqInvitation.createMany({ data: workshops.map((w) => ({ rfqId: rfq.id, workshopId: w.id })), skipDuplicates: true });
}
async function ensureBids(rfq, workshops, offers) {
  const bids = [];
  for (let i = 0; i < offers.length; i++) {
    const [qty, price] = offers[i];
    bids.push(await prisma.bid.upsert({ where: { rfqId_workshopId: { rfqId: rfq.id, workshopId: workshops[i].id } }, update: {},
      create: { rfqId: rfq.id, workshopId: workshops[i].id, quantityOffered: qty, unitPrice: price,
        leadTimeDays: 20 + i * 2, status: 'SUBMITTED', note: 'Thực hiện thủ công theo yêu cầu' } }));
    await prisma.rfqInvitation.update({ where: { rfqId_workshopId: { rfqId: rfq.id, workshopId: workshops[i].id } },
      data: { status: 'BID_SUBMITTED' } });
  }
  return bids;
}
async function ensureRfq({ buyer, categoryId, code, title, qty, status }) {
  return prisma.rfq.upsert({ where: { code }, update: {}, create: {
    code, buyerId: buyer.id, categoryId, title, description: 'Yêu cầu sản phẩm gốm thủ công làm theo mẫu, bao gói cẩn thận.',
    quantity: qty, unit: 'chiếc', budgetMax: 400000000, bidDeadline: inDays(15), requiredBy: dateOnly(65),
    contactName: buyer.fullName, contactPhone: buyer.phone, deliveryAddress: '144 Xuân Thủy, Cầu Giấy, Hà Nội',
    status, ...(status === 'DRAFT' ? {} : { sentAt: new Date() }),
  } });
}
async function ensurePlanAndOrder({ rfq, admin, workshops, offers, quantities, status, orderStatus, completed }) {
  const bids = await ensureBids(rfq, workshops, offers);
  const rows = quantities.map((quantity, i) => ({
    bidId: bids[i].id, workshopId: workshops[i].id, quantity,
    unitPrice: offers[i][1], lineTotal: String(quantity * offers[i][1]), dueDate: dateOnly(45 + i * 2),
  }));
  let plan = await prisma.allocationPlan.findFirst({ where: { rfqId: rfq.id, status: { not: 'REJECTED' } } });
  if (!plan) plan = await prisma.allocationPlan.create({ data: {
    rfqId: rfq.id, createdById: admin.id, status, totalQuantity: qtySum(quantities),
    totalAmount: String(rows.reduce((sum, row) => sum + Number(row.lineTotal), 0)),
    sentAt: new Date(), ...(status === 'ACCEPTED' ? { decidedAt: new Date() } : {}),
    items: { create: rows },
  }, include: { items: true } });
  if (status === 'PENDING_BUYER') {
    await prisma.bid.updateMany({ where: { id: { in: bids.map((b) => b.id) } }, data: { lockedAt: new Date() } });
    return;
  }
  const exists = await prisma.order.findUnique({ where: { rfqId: rfq.id } });
  if (exists) return;
  const order = await prisma.order.create({ data: {
    code: `ORD-2026-${rfq.code.split('-').at(-1)}`, rfqId: rfq.id, planId: plan.id, buyerId: rfq.buyerId,
    status: orderStatus, totalAmount: plan.totalAmount,
    ...(orderStatus === 'DELIVERED' ? { receivedAt: new Date() } : {}),
  } });
  const planItems = await prisma.allocationPlanItem.findMany({ where: { planId: plan.id }, orderBy: { dueDate: 'asc' } });
  await prisma.productionTask.createMany({ data: planItems.map((item, i) => ({
    orderId: order.id, workshopId: item.workshopId, planItemId: item.id, quantity: item.quantity,
    unitPrice: item.unitPrice, dueDate: item.dueDate,
    status: completed[i] === item.quantity ? 'COMPLETED' : completed[i] > 0 ? 'IN_PROGRESS' : 'ASSIGNED',
    completedQuantity: completed[i], progressNote: completed[i] ? 'Đã hoàn thành các công đoạn đầu tiên' : null,
    ...(completed[i] > 0 ? { startedAt: new Date() } : {}),
    ...(completed[i] === item.quantity ? { completedAt: new Date() } : {}),
  })) });
  await prisma.bid.updateMany({ where: { rfqId: rfq.id }, data: { status: 'ACCEPTED', lockedAt: new Date() } });
}
const qtySum = (rows) => rows.reduce((sum, row) => sum + row, 0);
async function main() {
  const hash = await bcrypt.hash(demoPassword, 12);
  const admin = await user('admin@vcraft.demo', 'Ban quản lý Bát Tràng', 'ADMIN', hash);
  const buyers = [];
  for (let i = 0; i < 3; i++) buyers.push(await user(`buyer${i+1}@vcraft.demo`, ['Nguyễn Minh Khang', 'Trần Minh An', 'Phạm Thanh Hà'][i], 'BUYER', hash));
  const cats = [];
  for (const [name, slug] of categoriesSeed) cats.push(await prisma.category.upsert({ where: { slug }, update: {}, create: { name, slug } }));
  const workshops = [];
  for (let i = 0; i < workshopSeed.length + 2; i++) {
    const sample = workshopSeed[i] || { slug: `xuong-cho-duyet-${i}`, name: `Xưởng chờ duyệt ${i - 5}`,
      owner: `nghe.nhan0${i+1}@vcraft.demo`, lat: null, lng: null, image: 'bowl.svg', cat: [0] };
    const artisan = await user(sample.owner, `Nghệ nhân ${sample.name}`, 'ARTISAN', hash);
    const workshop = await prisma.workshop.upsert({ where: { slug: sample.slug }, update: {}, create: {
      slug: sample.slug, name: sample.name, ownerId: artisan.id, address: 'Bát Tràng, Gia Lâm, Hà Nội',
      status: i < workshopSeed.length ? 'APPROVED' : 'PENDING',
      reviewedById: i < workshopSeed.length ? admin.id : null,
      reviewedAt: i < workshopSeed.length ? new Date() : null,
      description: `Xưởng thủ công ${sample.name} với truyền thống làm gốm nhiều thế hệ.`,
      history: 'Gia đình lưu giữ kỹ thuật tạo dáng, phủ men và nung gốm thủ công.',
      latitude: sample.lat, longitude: sample.lng,
      isOpenForVisit: i % 2 === 0, openingHours: { mon: [['08:00','17:00']], sun: [] },
    } });
    await prisma.workshopCategory.createMany({ data: sample.cat.map((j) => ({ workshopId: workshop.id, categoryId: cats[j].id })), skipDuplicates: true });
    if (!await prisma.workshopImage.count({ where: { workshopId: workshop.id } })) {
      await prisma.workshopImage.create({ data: { workshopId: workshop.id, imageUrl: thumb(sample.image), thumbUrl: thumb(sample.image), altText: sample.name } });
    }
    if (i < workshopSeed.length) workshops.push(workshop);
  }
  const seededProducts = [];
  for (let i = 0; i < workshops.length; i++) {
    for (let j = 0; j < names.length; j++) {
      const slug = `${slugify(names[j])}-${workshops[i].slug}`;
      const categoryId = cats[workshopSeed[i].cat[j % workshopSeed[i].cat.length]].id;
      const product = await prisma.product.upsert({ where: { slug }, update: {}, create: {
        slug, name: names[j], workshopId: workshops[i].id, categoryId, status: 'VISIBLE',
        description: `${names[j]}, sản xuất thủ công tại ${workshops[i].name}.`, price: 65000 + j * 43000,
        specifications: { chatLieu: 'Đất sét Bát Tràng', kyThuat: 'Nung lò truyền thống' },
      } });
      if (!await prisma.productImage.count({ where: { productId: product.id } })) {
        await prisma.productImage.create({ data: { productId: product.id, imageUrl: thumb(images[j % 3]),
          thumbUrl: thumb(images[j % 3]), altText: product.name, isPrimary: true } });
      }
      seededProducts.push(product);
    }
  }
  for (let i = 0; i < 2; i++) {
    const batch = await prisma.productionBatch.upsert({ where: { batchCode: `BT-DEMO-${i+1}` }, update: {},
      create: { batchCode: `BT-DEMO-${i+1}`, workshopId: workshops[i].id, name: `Lô gốm thủ công số ${i+1}`,
        description: 'Hành trình từ đất sét Bát Tràng tới sản phẩm men hoàn thiện.', status: 'COMPLETED', isPublic: true,
        startedAt: inDays(-15), completedAt: inDays(-1) } });
    for (let j = 0; j < 2; j++) await prisma.batchProduct.upsert({ where: { batchId_productId: {
      batchId: batch.id, productId: seededProducts[i * 5 + j].id } }, update: {}, create: {
      batchId: batch.id, productId: seededProducts[i * 5 + j].id, quantity: 20 + j * 10,
    } });
    if (!await prisma.productionMilestone.count({ where: { batchId: batch.id } })) {
      for (const [j, title] of ['Chọn đất', 'Vuốt hình', 'Phơi và sửa dáng', 'Tráng men', 'Nung và hoàn thiện'].entries()) {
        const m = await prisma.productionMilestone.create({ data: { batchId: batch.id, title, orderIndex: j,
          occurredAt: inDays(-15 + j * 3), updatedById: (await prisma.workshop.findUnique({ where: { id: workshops[i].id } })).ownerId,
          description: `${title} — công đoạn thực hiện thủ công bởi nghệ nhân.` } });
        await prisma.milestoneImage.create({ data: { milestoneId: m.id, imageUrl: thumb(images[j % 3]), thumbUrl: thumb(images[j % 3]) } });
      }
    }
  }
  const drafts = [
    { code: 'RFQ-2026-DEMO1', title: 'Bộ cốc sứ phục vụ sự kiện đại học', qty: 5000, status: 'DRAFT', buyer: buyers[0] },
    { code: 'RFQ-2026-DEMO2', title: 'Quà tặng gốm cho hội nghị', qty: 1500, status: 'SENT', buyer: buyers[0] },
    { code: 'RFQ-2026-DEMO3', title: '5.000 cốc in logo trường đại học', qty: 5000, status: 'BIDDING', buyer: buyers[0] },
    { code: 'RFQ-2026-DEMO4', title: 'Bình hoa men lam cho nhà hàng', qty: 2500, status: 'IN_PRODUCTION', buyer: buyers[0] },
    { code: 'RFQ-2026-DEMO5', title: 'Bộ trà gốm cao cấp phục vụ du lịch', qty: 2000, status: 'IN_PRODUCTION', buyer: buyers[1] },
    { code: 'RFQ-2026-DEMO6', title: 'Quà tặng lưu niệm gốm công ty', qty: 1200, status: 'DELIVERED', buyer: buyers[2] },
  ];
  const rfqs = [];
  for (const d of drafts) rfqs.push(await ensureRfq({ ...d, categoryId: cats[0].id }));
  for (const rfq of rfqs.slice(1)) await ensureInvitations(rfq, workshops.slice(0, 3));
  await ensurePlanAndOrder({ rfq: rfqs[2], admin, workshops: workshops.slice(0, 3),
    offers: [[2000, 42000], [1800, 44000], [1200, 41000]], quantities: [2000, 1800, 1200], status: 'PENDING_BUYER' });
  await ensurePlanAndOrder({ rfq: rfqs[3], admin, workshops: workshops.slice(0, 2),
    offers: [[1400, 45000], [1100, 43000]], quantities: [1400, 1100], status: 'ACCEPTED', orderStatus: 'IN_PRODUCTION', completed: [600, 0] });
  await ensurePlanAndOrder({ rfq: rfqs[4], admin, workshops: workshops.slice(0, 2),
    offers: [[1000, 52000], [1000, 51000]], quantities: [1000, 1000], status: 'ACCEPTED', orderStatus: 'READY', completed: [1000, 1000] });
  await ensurePlanAndOrder({ rfq: rfqs[5], admin, workshops: workshops.slice(0, 2),
    offers: [[600, 40000], [600, 43000]], quantities: [600, 600], status: 'ACCEPTED', orderStatus: 'DELIVERED', completed: [600, 600] });
  for (const [i, n] of [
    ['MATERIAL_PRICE', 'Cập nhật giá đất sét đầu mùa'], ['POWER_OUTAGE', 'Lịch bảo trì lưới điện khu lò nung'],
    ['SUPPORT_POLICY', 'Chương trình quảng bá làng nghề'],
  ].entries()) await prisma.news.upsert({ where: { slug: slugify(n[1]) }, update: {}, create: {
    slug: slugify(n[1]), category: n[0], title: n[1], content: 'Thông báo minh họa cho dữ liệu thử nghiệm vCraft.',
    status: 'PUBLISHED', isFeatured: true, publishedAt: new Date(),
  } });
  console.log(`Seed ready: ${buyers.length} Buyers, ${workshops.length} approved workshops, ${seededProducts.length} products, 6 RFQs`);
  console.log('Demo credentials (local development only): buyer1@vcraft.demo / Demo@2026!');
}
main().catch((error) => { console.error(error);process.exitCode = 1; }).finally(() => prisma.$disconnect());
