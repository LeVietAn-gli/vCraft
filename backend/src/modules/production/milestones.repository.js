// File này làm gì: Ghi mốc, người cập nhật và thứ tự trong lô.
// Ai gọi file này: Router quản lý nhật ký sản xuất.
import { AppError } from '../../errors.js'
import { approvedWorkshop } from '../workshops/approved-workshop.js'
import { milestoneView, ownBatch, ownMilestone } from './batch-scope.repository.js'

// Mọi ghi mốc dùng cùng khóa xưởng với ghi ảnh và xóa lô.
export function milestoneRepository(db) {
  function write(ownerId, action) {
    return db.$transaction(async (tx) => action(tx, await approvedWorkshop(tx, ownerId, true)))
  }

  // Mốc mới nối cuối nhật ký, danh tính lấy từ phiên.
  function create(ownerId, batchId, data) {
    return write(ownerId, async (tx, workshopId) => {
      await ownBatch(tx, workshopId, batchId, { id: true })
      const { _max } = await tx.productionMilestone.aggregate({
        where: { batchId },
        _max: { orderIndex: true },
      })
      return tx.productionMilestone.create({
        data: { ...data, batchId, orderIndex: (_max.orderIndex ?? -1) + 1, updatedById: ownerId },
        select: milestoneView.select,
      })
    })
  }

  // Chỉ sửa mốc thuộc xưởng của người cập nhật.
  function update(ownerId, id, data) {
    return write(ownerId, async (tx, workshopId) => {
      await ownMilestone(tx, workshopId, id)
      return tx.productionMilestone.update({
        where: { id },
        data: { ...data, updatedById: ownerId },
        select: milestoneView.select,
      })
    })
  }

  // Trả các ảnh đã mất liên kết để service dọn sau khi database xóa thành công.
  function remove(ownerId, id) {
    return write(ownerId, async (tx, workshopId) => {
      const milestone = await ownMilestone(tx, workshopId, id)
      await tx.productionMilestone.delete({ where: { id } })
      return milestone.images
    })
  }

  // Dời thứ tự cũ sang vùng trống, sau đó gán thứ tự mới trong cùng giao dịch.
  function reorder(ownerId, batchId, ids) {
    return write(ownerId, async (tx, workshopId) => {
      await ownBatch(tx, workshopId, batchId, { id: true })
      const current = await tx.productionMilestone.findMany({
        where: { batchId },
        orderBy: { orderIndex: 'asc' },
        select: { id: true, orderIndex: true },
      })
      const requested = new Set(ids)
      if (current.length !== ids.length || current.some(({ id }) => !requested.has(id))) {
        throw new AppError(409, 'MILESTONES_CHANGED', 'Tải lại lô để lấy đúng danh sách mốc.')
      }
      if (!ids.length) return []
      const offset = Math.max(current.at(-1).orderIndex + 1, ids.length)
      // Vùng tạm nằm trên cả dãy chỉ số cũ và mới, nên không va chạm UNIQUE.
      await tx.productionMilestone.updateMany({
        where: { batchId },
        data: { orderIndex: { increment: offset } },
      })
      for (const [orderIndex, id] of ids.entries()) {
        await tx.productionMilestone.update({
          where: { id },
          data: { orderIndex, updatedById: ownerId },
        })
      }
      return tx.productionMilestone.findMany({ where: { batchId }, ...milestoneView })
    })
  }

  return { create, update, remove, reorder }
}
