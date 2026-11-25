// File này làm gì: Lấy lô và mốc trong phạm vi xưởng đang đăng nhập.
// Ai gọi file này: Repository quản lý lô và nhật ký sản xuất.
import { AppError } from '../../errors.js'

export const milestoneView = {
  orderBy: { orderIndex: 'asc' },
  select: {
    id: true,
    title: true,
    description: true,
    occurredAt: true,
    orderIndex: true,
    updatedById: true,
    images: {
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      select: { id: true, imageUrl: true, thumbUrl: true, altText: true, sortOrder: true },
    },
  },
}

// Tìm lô thuộc xưởng, để một ID của xưởng khác cũng trả 404.
export async function ownBatch(db, workshopId, id, select) {
  const batch = await db.productionBatch.findFirst({
    where: { id, workshopId },
    ...(select ? { select } : {}),
  })
  if (!batch) throw new AppError(404, 'BATCH_NOT_FOUND', 'Không tìm thấy lô của xưởng.')
  return batch
}

// Tìm mốc qua xưởng của lô vì mốc không lưu workshopId riêng.
export async function ownMilestone(db, workshopId, id) {
  const milestone = await db.productionMilestone.findFirst({
    where: { id, batch: { workshopId } },
    select: milestoneView.select,
  })
  if (!milestone) throw new AppError(404, 'MILESTONE_NOT_FOUND', 'Không tìm thấy mốc của xưởng.')
  return milestone
}
