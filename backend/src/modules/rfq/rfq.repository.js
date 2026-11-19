import { prisma } from '../../lib/prisma.js';

const publicWorkshop = { select: { id: true, name: true, slug: true,
  images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { thumbUrl: true } } } };
const rfqInclude = {
  category: { select: { id: true, name: true } },
  referenceProduct: { select: { id: true, slug: true, name: true } },
  invitations: { include: { workshop: publicWorkshop }, orderBy: { createdAt: 'asc' } },
  _count: { select: { bids: true } },
  order: { select: { id: true, status: true } },
};
export const rfqRepository = {
  create: (data) => prisma.rfq.create({ data, include: rfqInclude }),
  get: (where) => prisma.rfq.findFirst({ where, include: rfqInclude }),
  getRaw: (where) => prisma.rfq.findFirst({ where }),
  list: async (where, page, limit) => {
    const [data, total] = await prisma.$transaction([
      prisma.rfq.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit,
        take: limit, include: { category: { select: { name: true } }, _count: { select: { bids: true } } } }),
      prisma.rfq.count({ where }),
    ]);
    return { data, total };
  },
  update: (where, data) => prisma.rfq.update({ where, data, include: rfqInclude }),
  findMatchingWorkshops: (tx, categoryId) => tx.workshop.findMany({
    where: { status: 'APPROVED', acceptsOrders: true, categories: { some: { categoryId } } },
    select: { id: true },
  }),
};
