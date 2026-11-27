import { AppError } from '../../errors.js'
import { checkDates, contact, draft } from './buyer.schema.js'

export const transition = () =>
  new AppError(409, 'INVALID_TRANSITION', 'Trạng thái hiện tại không cho phép thao tác này.')
async function checkReference(repo, { categoryId, referenceProductId }) {
  if (!(await repo.checkCategory(categoryId)))
    throw new AppError(400, 'VALIDATION_ERROR', 'Danh mục không tồn tại.')
  if (referenceProductId && !(await repo.checkProduct(referenceProductId, categoryId)))
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Sản phẩm tham khảo phải đang trưng bày và cùng danh mục.',
    )
}
function dates(value) {
  return {
    ...value,
    bidDeadline: new Date(value.bidDeadline),
    requiredBy: new Date(value.requiredBy),
  }
}
function storedDraft(row) {
  const fields = Object.fromEntries(Object.keys(draft.shape).map((key) => [key, row[key]]))
  return draft.parse({
    ...fields,
    budgetMax: row.budgetMax?.toString() ?? null,
    bidDeadline: row.bidDeadline.toISOString(),
    requiredBy: row.requiredBy.toISOString().slice(0, 10),
  })
}
export function rfqService(repo) {
  return {
    list: repo.listRfqs,
    detail: repo.rfqDetail,
    bids: repo.bids,
    currentPlan: repo.currentPlan,
    create(buyerId, body) {
      return repo.transaction(async (tx) => {
        checkDates(body)
        await checkReference(tx, body)
        const user = await tx.contact(buyerId)
        return tx.createRfq({
          ...dates(body),
          buyerId,
          contactName: body.contactName ?? user.fullName,
          contactPhone: body.contactPhone ?? user.phone,
        })
      })
    },
    edit(buyerId, id, changes) {
      return repo.transaction(async (tx) => {
        const row = await tx.lockRfq(buyerId, id)
        if (row.status === 'DRAFT') {
          const merged = { ...storedDraft(row), ...changes }
          checkDates(merged)
          await checkReference(tx, merged)
          return tx.updateRfq(id, dates(merged))
        }
        if (
          !['SENT', 'BIDDING'].includes(row.status) ||
          Object.keys(changes).some((key) => !Object.hasOwn(contact.shape, key))
        )
          throw transition()
        return tx.updateRfq(id, changes)
      })
    },
    send(buyerId, id) {
      return repo.transaction(async (tx) => {
        const row = await tx.lockRfq(buyerId, id)
        if (row.status !== 'DRAFT') throw transition()
        const value = storedDraft(row)
        checkDates(value)
        await checkReference(tx, value)
        const matches = await tx.matches(value.categoryId)
        if (!matches.length)
          throw new AppError(
            422,
            'NO_MATCHING_WORKSHOP',
            'Chưa có xưởng phù hợp. Hãy chọn lại danh mục trong bản nháp.',
          )
        await tx.invite(id, matches)
        return {
          ...(await tx.updateRfq(id, { status: 'SENT', sentAt: new Date() })),
          invitedCount: matches.length,
        }
      })
    },
  }
}
