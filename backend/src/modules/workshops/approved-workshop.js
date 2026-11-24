import { AppError } from '../../errors.js'

export async function approvedWorkshop(db, ownerId, lock = false) {
  const row = lock
    ? (
        await db.$queryRaw`SELECT "id", "status" FROM "Workshop" WHERE "ownerId" = ${ownerId}::uuid FOR UPDATE`
      )[0]
    : await db.workshop.findUnique({ where: { ownerId }, select: { id: true, status: true } })
  if (row?.status !== 'APPROVED') {
    throw new AppError(
      403,
      'WORKSHOP_NOT_APPROVED',
      'Chỉ nghệ nhân có xưởng đã duyệt được thao tác.',
    )
  }
  return row.id
}
