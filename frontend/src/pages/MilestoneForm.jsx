// File này làm gì: Nhập tiêu đề, mô tả và ngày của một mốc.
// Ai gọi file này: BatchJournal khi thêm hoặc sửa mốc.
import { Button, Field } from '../components/UI.jsx'

// datetime-local dùng giờ máy đang mở form, API nhận giờ ISO có múi giờ.
function localTime(value) {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

// Mốc được phép chưa rõ thời điểm. Khi đó gửi null thay vì tự đặt ngày.
export function MilestoneForm({ entry, busy, save }) {
  // Giữ ngày cũ tới từng giây nếu người dùng chỉ sửa tên hoặc mô tả.
  function submit(event) {
    event.preventDefault()
    if (busy) return
    const fields = new FormData(event.currentTarget)
    const pickedTime = fields.get('occurredAt')
    const occurredAt =
      pickedTime === localTime(entry?.occurredAt)
        ? (entry?.occurredAt ?? null)
        : pickedTime
          ? new Date(pickedTime).toISOString()
          : null
    save({ title: fields.get('title'), description: fields.get('description'), occurredAt })
  }

  return (
    <form className="panel stack" onSubmit={submit}>
      <fieldset className="stack" disabled={busy}>
        <legend>{entry ? 'Sửa mốc' : 'Thêm mốc'}</legend>
        <Field label="Tên mốc">
          {(props) => (
            <input {...props} name="title" required maxLength="255" defaultValue={entry?.title} />
          )}
        </Field>
        <Field label="Mô tả mốc">
          {(props) => (
            <textarea
              {...props}
              name="description"
              rows="3"
              maxLength="10000"
              defaultValue={entry?.description}
            />
          )}
        </Field>
        <Field label="Thời điểm (giờ trên thiết bị, có thể để trống)">
          {(props) => (
            <input
              {...props}
              name="occurredAt"
              type="datetime-local"
              defaultValue={localTime(entry?.occurredAt)}
            />
          )}
        </Field>
        <div>
          <Button type="submit" disabled={busy}>
            Lưu mốc
          </Button>
        </div>
      </fieldset>
    </form>
  )
}
