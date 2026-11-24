import { AppError } from '../../errors.js'
import { approvedWorkshop } from '../workshops/approved-workshop.js'

const projection = { id: true, imageUrl: true, thumbUrl: true, altText: true, sortOrder: true }
const listView = { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], select: projection }

export function milestoneImageRepository(db) {
  async function owned(tx, ownerId, id, lock) {
    const workshopId = await approvedWorkshop(tx, ownerId, lock)
    const milestone = await tx.productionMilestone.findFirst({
      where: { id, batch: { workshopId } },
      select: { id: true, title: true, images: listView },
    })
    if (!milestone) throw new AppError(404, 'MILESTONE_NOT_FOUND', 'Không tìm thấy mốc của xưởng.')
    return milestone
  }
  return {
    get: (ownerId, id) => owned(db, ownerId, id, false),
    async list(ownerId) {
      const workshopId = await approvedWorkshop(db, ownerId)
      return db.productionMilestone.findMany({
        where: { batch: { workshopId } },
        orderBy: [{ batchId: 'asc' }, { orderIndex: 'asc' }],
        select: { id: true, title: true, batch: { select: { name: true, batchCode: true } } },
      })
    },
    append(ownerId, id, entries) {
      return db.$transaction(async (tx) => {
        const { images } = await owned(tx, ownerId, id, true)
        if (images.length + entries.length > 100)
          throw new AppError(409, 'ALBUM_FULL', 'Tối đa 100 ảnh mỗi mốc.')
        const start = (images.at(-1)?.sortOrder ?? -1) + 1
        const added = await tx.milestoneImage.createManyAndReturn({
          data: entries.map((entry, index) => ({
            ...entry,
            milestoneId: id,
            sortOrder: start + index,
          })),
          select: projection,
        })
        return added.sort((a, b) => a.sortOrder - b.sortOrder)
      })
    },
    remove(ownerId, id, imageId) {
      return db.$transaction(async (tx) => {
        const { images } = await owned(tx, ownerId, id, true)
        const image = images.find(({ id }) => id === imageId)
        if (!image) throw new AppError(404, 'IMAGE_NOT_FOUND', 'Không tìm thấy ảnh của mốc.')
        await tx.milestoneImage.delete({ where: { id: imageId } })
        return image
      })
    },
  }
}
