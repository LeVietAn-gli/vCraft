import { prisma } from '../../lib/prisma.js';
const details = {
  rfq: { select: { id: true, code: true, title: true, quantity: true, unit: true, requiredBy: true } },
  tasks: { orderBy: { dueDate: 'asc' }, include: {
    workshop: { select: { id: true, name: true, slug: true } },
    batch: { select: { batchCode: true, name: true, isPublic: true } },
  } },
};
export const ordersRepository = {
  findPlan: (tx, id) => tx.allocationPlan.findUnique({ where: { id }, include: {
    rfq: true,
    items: { include: { bid: true } },
    order: true,
  } }),
  findExistingOrder: (tx, planId, buyerId) => tx.order.findFirst({ where: { planId, buyerId } }),
  byId: (where) => prisma.order.findFirst({ where, include: details }),
  list: async (where, page, limit) => {
    const [data, total] = await prisma.$transaction([
      prisma.order.findMany({ where, orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit, take: limit, include: details }),
      prisma.order.count({ where }),
    ]);
    return { data, total };
  },
};
