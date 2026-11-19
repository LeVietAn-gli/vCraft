import { prisma } from '../../lib/prisma.js';
export const authRepository = {
  findByEmail: (email) => prisma.user.findUnique({ where: { email } }),
  findPublic: (id) => prisma.user.findUnique({ where: { id }, select: {
    id: true, email: true, fullName: true, phone: true, role: true, status: true,
    workshop: { select: { id: true, slug: true, name: true, status: true } },
  } }),
  createUserWithWorkshop: (data, workshop) => prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data });
    if (workshop) {
      const { slugify } = await import('../../utils/code.js');
      const { randomBytes } = await import('node:crypto');
      const suffix = randomBytes(4).toString('hex');
      await tx.workshop.create({ data: {
        ownerId: user.id, name: workshop.name, address: workshop.address,
        slug: `${slugify(workshop.name)}-${suffix}`,
        categories: { create: [...new Set(workshop.categoryIds)].map((categoryId) => ({ categoryId })) },
      } });
    }
    return user;
  }),
};
