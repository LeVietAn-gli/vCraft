export class AppError extends Error {
  constructor(status, code, message = null, details = null) {
    super(message || messages[code] || 'Yêu cầu không thực hiện được');
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
export const messages = {
  UNAUTHENTICATED: 'Vui lòng đăng nhập để tiếp tục',
  FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này',
  CSRF_REJECTED: 'Nguồn gửi yêu cầu không hợp lệ',
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ',
  EMAIL_TAKEN: 'Email này đã được sử dụng',
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
  RFQ_NOT_FOUND: 'Không tìm thấy yêu cầu báo giá',
  PLAN_NOT_FOUND: 'Không tìm thấy phương án',
  ORDER_NOT_FOUND: 'Không tìm thấy đơn hàng',
  INVALID_TRANSITION: 'Không thể chuyển trạng thái trong tình huống hiện tại',
  NO_MATCHING_WORKSHOP: 'Chưa có xưởng phù hợp với danh mục; vui lòng chọn danh mục khác',
  ORDER_ALREADY_EXISTS: 'Đơn hàng đã được tạo',
  PLAN_REJECTED: 'Phương án này đã bị từ chối',
  PLAN_NOT_SENT: 'Phương án chưa được gửi cho Buyer',
  PLAN_INVALID: 'Dữ liệu phân bổ không hợp lệ hoặc đã thay đổi',
  RFQ_NOT_BIDDING: 'RFQ không ở trạng thái nhận báo giá',
  INTERNAL_ERROR: 'Máy chủ đang gặp sự cố; vui lòng thử lại',
};
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
