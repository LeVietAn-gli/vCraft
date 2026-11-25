// File này làm gì: Lưu và truy vấn lô cùng sản phẩm của xưởng.
// Ai gọi file này: batches.service.js thông qua router sản xuất.
import { AppError } from '../../errors.js'
import { approvedWorkshop } from '../workshops/approved-workshop.js'
import { milestoneView, ownBatch } from './batch-scope.repository.js'

const detail = {
  id: true,
  batchCode: true,
  name: true,
  description: true,
  status: true,
  isPublic: true,
  startedAt: true,
  completedAt: true,
  products: {
    orderBy: { productId: 'asc' },
    select: { productId: true, quantity: true, product: { select: { name: true, slug: true } } },
  },
  milestones: milestoneView,
}

// So số sản phẩm hợp lệ với số ID đã được Zod kiểm tra không trùng.
async function checkProducts(tx, workshopId, products) {
  const ids = products.map(({ productId }) => productId)
  const count = await tx.product.count({ where: { workshopId, id: { in: ids } } })
  if (count !== ids.length)
    throw new AppError(400, 'PRODUCT_NOT_IN_WORKSHOP', 'Chỉ chọn sản phẩm của xưởng mình.')
}

// Ghi thời điểm khi lô đổi trạng thái, giữ ngày đã ghi nếu chỉ sửa nội dung.
function statusDates(batch, status) {
  if (!status || status === batch.status) return {}
  const now = new Date()
  if (status === 'PLANNED') return { startedAt: null, completedAt: null }
  if (status === 'IN_PROGRESS') return { startedAt: batch.startedAt ?? now, completedAt: null }
  if (status === 'COMPLETED') return { startedAt: batch.startedAt ?? now, completedAt: now }
  return {}
}

// Cấp quyền dựa trên phiên và khóa xưởng cho mọi thao tác ghi.
export function batchRepository(db) {
  async function write(ownerId, action) {
    return db.$transaction(async (tx) => action(tx, await approvedWorkshop(tx, ownerId, true)))
  }

  // Lấy danh sách riêng và tổng kết quả trên cùng ảnh chụp dữ liệu.
  async function list(ownerId, { status, page, limit }) {
    return db.$transaction(
      async (tx) => {
        const workshopId = await approvedWorkshop(tx, ownerId)
        const where = { workshopId, status }
        const data = await tx.productionBatch.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          skip: (page - 1) * limit,
          take: limit,
          select: { id: true, batchCode: true, name: true, status: true, isPublic: true },
        })
        const total = await tx.productionBatch.count({ where })
        return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
      },
      { isolationLevel: 'RepeatableRead' },
    )
  }

  // Trả cả mốc và ảnh để form sửa lô không cần truy vấn từng mốc.
  async function get(ownerId, id) {
    const workshopId = await approvedWorkshop(db, ownerId)
    return ownBatch(db, workshopId, id, detail)
  }

  // Tạo lô và các dòng số lượng trong cùng giao dịch.
  function create(ownerId, batchCode, { products, ...data }) {
    return write(ownerId, async (tx, workshopId) => {
      await checkProducts(tx, workshopId, products)
      return tx.productionBatch.create({
        data: { ...data, workshopId, batchCode, products: { create: products } },
        select: detail,
      })
    })
  }

  // Thay danh sách sản phẩm sau khi đã kiểm tra quyền và toàn bộ ID mới.
  function update(ownerId, id, { products, ...data }) {
    return write(ownerId, async (tx, workshopId) => {
      const batch = await ownBatch(tx, workshopId, id)
      if (products) {
        await checkProducts(tx, workshopId, products)
        await tx.batchProduct.deleteMany({ where: { batchId: id } })
      }
      return tx.productionBatch.update({
        where: { id },
        data: {
          ...data,
          ...statusDates(batch, data.status),
          ...(products ? { products: { create: products } } : {}),
        },
        select: detail,
      })
    })
  }

  // Chỉ xóa lô kế hoạch chưa công khai, trả đường dẫn để dọn file sau commit.
  function remove(ownerId, id) {
    return write(ownerId, async (tx, workshopId) => {
      const batch = await ownBatch(tx, workshopId, id, detail)
      if (batch.status !== 'PLANNED' || batch.isPublic) {
        throw new AppError(409, 'BATCH_IN_USE', 'Chỉ xóa được lô kế hoạch chưa công khai.')
      }
      await tx.productionBatch.delete({ where: { id } })
      return batch.milestones.flatMap((entry) => entry.images)
    })
  }

  return { list, get, create, update, remove }
}
