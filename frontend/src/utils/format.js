export const money = (v) => v === null || v === undefined ? 'Liên hệ báo giá' :
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(v));
export const number = (v) => new Intl.NumberFormat('vi-VN').format(Number(v || 0));
export const date = (v) => v ? new Intl.DateTimeFormat('vi-VN', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(v)) : 'Chưa cập nhật';
export const dateTime = (v) => v ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(v)) : 'Chưa cập nhật';
export const rfqLabel = { DRAFT: 'Bản nháp', SENT: 'Đã gửi', BIDDING: 'Đang nhận báo giá', ACCEPTED: 'Đã duyệt phương án', IN_PRODUCTION: 'Đang sản xuất', DELIVERED: 'Đã giao' };
export const planLabel = { DRAFT: 'Nháp phương án', PENDING_BUYER: 'Chờ bạn duyệt', ACCEPTED: 'Đã chấp nhận', REJECTED: 'Đã từ chối' };
export const orderLabel = { IN_PRODUCTION: 'Đang sản xuất', READY: 'Chờ nhận hàng', DELIVERED: 'Đã nhận hàng' };
export const taskLabel = { ASSIGNED: 'Được giao', IN_PROGRESS: 'Đang thực hiện', COMPLETED: 'Đã hoàn thành' };
export const batchLabel = { PLANNED: 'Dự kiến', IN_PROGRESS: 'Đang thực hiện', COMPLETED: 'Đã hoàn thiện', CANCELLED: 'Đã hủy' };
export const nextStep = (rfq) => ({ DRAFT: 'Tiếp tục chỉnh sửa và gửi yêu cầu', SENT: 'Chờ các xưởng chào giá', BIDDING: 'Xem báo giá và phương án chia đơn', ACCEPTED: 'Đơn đang được khởi tạo', IN_PRODUCTION: 'Theo dõi tiến độ của các xưởng', DELIVERED: 'Đơn đã hoàn tất' }[rfq.status] || 'Xem chi tiết');
export const onlyInternalNext = (value) => (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') && !value.includes('\\') && !/[\r\n]/.test(value) && !value.startsWith('/dang-nhap') && !value.startsWith('/dang-ky')) ? value : '/buyer/rfqs';
