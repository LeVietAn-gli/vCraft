/**
 * Temporary READ-ONLY integration surface for N2/N3 public resources.
 * Kept isolated so the owning teammates can replace these routers without touching Buyer logic.
 * Never exposes hidden products, unapproved workshops, private batches or unpublished news.
 */
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middlewares/validate.js';
import { AppError, asyncHandler } from '../utils/error.js';
import { paginationMeta } from '../utils/pagination.js';

export const catalogRouter = Router();
export const workshopRouter = Router();
export const categoryRouter = Router();
export const traceRouter = Router();
export const newsRouter = Router();
const pageSchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(20) }).passthrough();
const productQuery = pageSchema.extend({ q: z.string().trim().max(100).optional(), categoryId: z.string().uuid().optional(),
  workshop: z.string().max(255).optional(), minPrice: z.coerce.number().min(0).optional(), maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(['-createdAt', 'createdAt', 'price', '-price']).optional() });
const newsQuery = pageSchema.extend({ category: z.enum(['MATERIAL_PRICE', 'POWER_OUTAGE', 'SUPPORT_POLICY']).optional(),
  featured: z.enum(['true', 'false']).optional() });
const workshopQuery = pageSchema.extend({ q: z.string().trim().max(100).optional(), categoryId: z.string().uuid().optional(),
  isOpenForVisit: z.enum(['true', 'false']).optional() });
const selectedImages = { orderBy: { sortOrder: 'asc' }, take: 1, select: { thumbUrl: true, imageUrl: true, altText: true } };
const selectedProduct = { category: { select: { id: true, name: true } },
  workshop: { select: { name: true, slug: true, status: true } }, images: selectedImages };
function withThumb(item) { return { ...item, thumbUrl: item.images?.[0]?.thumbUrl ?? null }; }

categoryRouter.get('/', asyncHandler(async (_req, res) => {
  res.json({ data: await prisma.category.findMany({ orderBy: { name: 'asc' } }) });
}));
catalogRouter.get('/', validate(productQuery, 'query'), asyncHandler(async (req, res) => {
  const { q, categoryId, workshop, minPrice, maxPrice, sort, page, limit } = req.validatedQuery;
  const where = { status: 'VISIBLE', workshop: { status: 'APPROVED', ...(workshop ? { slug: workshop } : {}) },
    ...(categoryId ? { categoryId } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] } : {}),
    ...(minPrice !== undefined || maxPrice !== undefined ? { price: { ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}) } } : {}),
  };
  const orderBy = sort === 'price' ? { price: 'asc' } : sort === '-price' ? { price: 'desc' } :
    sort === 'createdAt' ? { createdAt: 'asc' } : { createdAt: 'desc' };
  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({ where, include: selectedProduct, orderBy, skip: (page - 1) * limit, take: limit }),
    prisma.product.count({ where }),
  ]);
  res.json({ data: items.map(withThumb), meta: paginationMeta(page, limit, total) });
}));
catalogRouter.get('/:slug', asyncHandler(async (req, res) => {
  const item = await prisma.product.findFirst({ where: { slug: req.params.slug, status: 'VISIBLE', workshop: { status: 'APPROVED' } },
    include: { category: true, workshop: { include: { images: selectedImages } },
      images: { orderBy: { sortOrder: 'asc' } },
      batchProducts: { where: { batch: { isPublic: true } }, include: { batch: { select: { batchCode: true, name: true } } } } } });
  if (!item) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm');
  res.json({ data: withThumb(item) });
}));
workshopRouter.get('/suggest', asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 100);
  const workshops = await prisma.workshop.findMany({ where: { status: 'APPROVED', ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}) },
    select: { slug: true, name: true, images: selectedImages }, take: 8 });
  res.json({ data: workshops.map(withThumb) });
}));
workshopRouter.get('/map', asyncHandler(async (req, res) => {
  const visit = req.query.isOpenForVisit === 'true' ? { isOpenForVisit: true } : {};
  const list = await prisma.workshop.findMany({ where: { status: 'APPROVED', latitude: { not: null }, longitude: { not: null }, ...visit },
    select: { slug: true, name: true, address: true, latitude: true, longitude: true, isOpenForVisit: true,
      openingHours: true, images: selectedImages, categories: { select: { category: { select: { name: true } } } } } });
  res.json({ data: list.map((workshop) => ({ ...withThumb(workshop), categories: workshop.categories.map((wc) => wc.category.name) })) });
}));
workshopRouter.get('/', validate(workshopQuery, 'query'), asyncHandler(async (req, res) => {
  const { page, limit, q, categoryId, isOpenForVisit } = req.validatedQuery;
  const where = { status: 'APPROVED', ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
    ...(categoryId ? { categories: { some: { categoryId } } } : {}),
    ...(isOpenForVisit ? { isOpenForVisit: isOpenForVisit === 'true' } : {}) };
  const [items, total] = await prisma.$transaction([
    prisma.workshop.findMany({ where, include: { images: selectedImages, categories: { include: { category: true } } },
      orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.workshop.count({ where }),
  ]);
  res.json({ data: items.map(withThumb), meta: paginationMeta(page, limit, total) });
}));
workshopRouter.get('/:slug', asyncHandler(async (req, res) => {
  const workshop = await prisma.workshop.findFirst({ where: { slug: req.params.slug, status: 'APPROVED' },
    include: { images: { orderBy: { sortOrder: 'asc' } }, certificates: true,
      categories: { include: { category: true } },
      products: { where: { status: 'VISIBLE' }, include: { images: selectedImages }, take: 20 } } });
  if (!workshop) throw new AppError(404, 'WORKSHOP_NOT_FOUND', 'Không tìm thấy xưởng');
  res.json({ data: withThumb(workshop) });
}));
traceRouter.get('/:batchCode', asyncHandler(async (req, res) => {
  const batch = await prisma.productionBatch.findFirst({ where: { batchCode: req.params.batchCode, isPublic: true, workshop: { status: 'APPROVED' } },
    include: { workshop: { select: { slug: true, name: true, address: true, images: selectedImages } },
      products: { where: { product: { status: 'VISIBLE' } }, include: { product: { include: { images: selectedImages } } } },
      milestones: { orderBy: { orderIndex: 'asc' }, include: { images: { orderBy: { sortOrder: 'asc' } } } } } });
  if (!batch) throw new AppError(404, 'BATCH_NOT_FOUND', 'Không tìm thấy lô công khai');
  res.json({ data: { batchCode: batch.batchCode, name: batch.name, description: batch.description,
    status: batch.status, startedAt: batch.startedAt, completedAt: batch.completedAt,
    workshop: withThumb(batch.workshop),
    products: batch.products.map((bp) => ({ slug: bp.product.slug, name: bp.product.name,
      quantity: bp.quantity, thumbUrl: bp.product.images[0]?.thumbUrl ?? null })),
    milestones: batch.milestones.map(({ title, description, orderIndex, occurredAt, images }) => ({
      title, description, orderIndex, occurredAt, images: images.map(({ imageUrl, thumbUrl, altText }) => ({ imageUrl, thumbUrl, altText })) })),
  } });
}));
newsRouter.get('/', validate(newsQuery, 'query'), asyncHandler(async (req, res) => {
  const { page, limit, featured, category } = req.validatedQuery;
  const where = { status: 'PUBLISHED', ...(featured === 'true' ? { isFeatured: true } : {}),
    ...(category ? { category } : {}) };
  const [data, total] = await prisma.$transaction([
    prisma.news.findMany({ where, orderBy: { publishedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.news.count({ where }),
  ]);
  res.json({ data, meta: paginationMeta(page, limit, total) });
}));
