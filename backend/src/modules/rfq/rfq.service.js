import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/error.js';
import { newCode } from '../../utils/code.js';
import { rfqRepository } from './rfq.repository.js';
import { paginationMeta } from '../../utils/pagination.js';
import { validateSendDates } from '../../domain/rfq-dates.js';

const contactFields = new Set(['contactName', 'contactPhone', 'deliveryAddress']);
function ownerWhere(id, user) {
  if (user.role === 'ADMIN') return { id };
  if (user.role === 'BUYER') return { id, buyerId: user.id };
  return { id, invitations: { some: { workshop: { ownerId: user.id, status: 'APPROVED' } } } };
}
export async function createRfq(userId, input) {
  const owner = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true, phone: true } });
  const data = { ...input, buyerId: userId,
    contactName: input.contactName || owner.fullName,
    contactPhone: input.contactPhone ?? owner.phone,
  };
  for (let attempt = 0; attempt < 4; attempt++) {
    try { return await rfqRepository.create({ ...data, code: newCode('RFQ') }); }
    catch (error) {
      if (error.code === 'P2002' && attempt < 3) continue;
      if (error.code === 'P2003') throw new AppError(400, 'VALIDATION_ERROR', 'Danh mục hoặc sản phẩm tham khảo không tồn tại');
      throw error;
    }
  }
}
export async function listRfqs(user, { status, page, limit }) {
  const where = { ...(user.role === 'BUYER' ? { buyerId: user.id } : {}), ...(status ? { status } : {}) };
  const result = await rfqRepository.list(where, page, limit);
  return { data: result.data, meta: paginationMeta(page, limit, result.total) };
}
export async function getRfq(user, id) {
  const rfq = await rfqRepository.get(ownerWhere(id, user));
  if (!rfq) throw new AppError(404, 'RFQ_NOT_FOUND');
  return rfq;
}
export async function updateRfq(userId, id, input) {
  const rfq = await rfqRepository.getRaw({ id, buyerId: userId });
  if (!rfq) throw new AppError(404, 'RFQ_NOT_FOUND');
  if (!['DRAFT', 'SENT', 'BIDDING'].includes(rfq.status)) throw new AppError(409, 'INVALID_TRANSITION');
  if (rfq.status !== 'DRAFT' && Object.keys(input).some((field) => !contactFields.has(field))) {
    throw new AppError(409, 'INVALID_TRANSITION', 'Sau khi gửi chỉ được sửa thông tin liên hệ và địa chỉ giao hàng');
  }
  const { count } = await prisma.rfq.updateMany({
    where: { id, buyerId: userId, status: rfq.status }, data: input,
  });
  if (count !== 1) throw new AppError(409, 'INVALID_TRANSITION');
  return rfqRepository.get({ id, buyerId: userId });
}
export async function sendRfq(userId, id) {
  return prisma.$transaction(async (tx) => {
    const rfq = await tx.rfq.findFirst({ where: { id, buyerId: userId } });
    if (!rfq) throw new AppError(404, 'RFQ_NOT_FOUND');
    if (rfq.status !== 'DRAFT') throw new AppError(409, 'INVALID_TRANSITION');
    validateSendDates(rfq);
    // Compare-and-set locks the RFQ row; only one sender can win.
    const transition = await tx.rfq.updateMany({ where: { id, buyerId: userId, status: 'DRAFT' },
      data: { status: 'SENT', sentAt: new Date() } });
    if (transition.count !== 1) throw new AppError(409, 'INVALID_TRANSITION');
    const workshops = await rfqRepository.findMatchingWorkshops(tx, rfq.categoryId);
    if (!workshops.length) throw new AppError(422, 'NO_MATCHING_WORKSHOP');
    await tx.rfqInvitation.createMany({ data: workshops.map(({ id: workshopId }) => ({ rfqId: id, workshopId })), skipDuplicates: true });
    return { id, status: 'SENT', invitedCount: workshops.length };
  });
}
