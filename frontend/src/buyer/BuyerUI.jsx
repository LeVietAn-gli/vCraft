import { Field } from '../components/UI.jsx'
export const rfqPath = '/buyer/rfq'
export const orderPath = '/buyer/don-hang'
export const rfqStates = ['DRAFT', 'SENT', 'BIDDING', 'ACCEPTED', 'IN_PRODUCTION', 'DELIVERED']
export const orderStates = ['IN_PRODUCTION', 'READY', 'DELIVERED']
export const labels = {
  DRAFT: 'Bản nháp',
  SENT: 'Đã gửi',
  BIDDING: 'Đang báo giá',
  ACCEPTED: 'Đã chấp nhận',
  IN_PRODUCTION: 'Đang sản xuất',
  DELIVERED: 'Đã nhận hàng',
  READY: 'Chờ nhận hàng',
  ASSIGNED: 'Đã giao việc',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Đã bàn giao',
  PENDING_BUYER: 'Chờ bạn duyệt',
  REJECTED: 'Đã từ chối',
  INVITED: 'Đã mời',
  VIEWED: 'Đã xem',
  BID_SUBMITTED: 'Đã báo giá',
}
export const currency = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 2,
  }).format(value)
export const date = (value) =>
  value ? new Intl.DateTimeFormat('vi-VN', { timeZone: 'UTC' }).format(new Date(value)) : '—'
export const instant = (value) => new Date(value).toLocaleString('vi-VN')
export function Input({ label, name, errors = {}, ...props }) {
  return (
    <Field label={label} error={errors[name]}>
      {(attrs) => <input {...attrs} name={name} {...props} />}
    </Field>
  )
}
export function Badge({ status }) {
  return <span className="buyerBadge">{labels[status] || status}</span>
}
export function Progress({ completedQuantity, quantity, unit }) {
  return (
    <div>
      <progress aria-label="Tiến độ hoàn thành" max={quantity || 1} value={completedQuantity} />
      <p>
        {completedQuantity.toLocaleString('vi-VN')} / {quantity.toLocaleString('vi-VN')} {unit}
      </p>
    </div>
  )
}
