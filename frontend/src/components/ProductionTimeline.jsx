// File này làm gì: Hiển thị nhật ký lô theo thứ tự cùng ảnh và ngày ghi nhận.
// Ai gọi file này: Trang truy xuất công khai và màn theo dõi lô của nghệ nhân.
import { Gallery } from './UI.jsx'
import styles from './ProductionTimeline.module.css'

const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
})

// Ngày thiếu được hiển thị rõ để người xem không hiểu nhầm là ngày tạo bản ghi.
function MilestoneTime({ value }) {
  if (!value) return <span>Chưa ghi thời điểm</span>
  return <time dateTime={value}>{dateFormat.format(new Date(value))}</time>
}

// Sắp theo orderIndex vì thứ tự diễn tiến có thể khác thứ tự theo ngày.
export function ProductionTimeline({ milestones = [] }) {
  const ordered = [...milestones].sort((a, b) => a.orderIndex - b.orderIndex)
  if (!ordered.length) return <p>Chưa có mốc nhật ký.</p>
  return (
    <ol className={styles.timeline}>
      {ordered.map((entry) => (
        <li key={entry.id ?? entry.orderIndex} className={styles.entry}>
          <p className="muted">
            <MilestoneTime value={entry.occurredAt} />
          </p>
          <h3>{entry.title}</h3>
          <p>{entry.description || 'Chưa có mô tả.'}</p>
          {entry.images.length ? (
            <Gallery images={entry.images} />
          ) : (
            <p className="muted">Chưa có ảnh.</p>
          )}
        </li>
      ))}
    </ol>
  )
}
