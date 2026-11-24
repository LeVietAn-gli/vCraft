// File này làm gì: Điều hướng danh sách theo dữ liệu phân trang từ API.
// Ai gọi file này: Catalog công khai và trang quản lý sản phẩm.
import { Button } from './UI.jsx'

// Nếu số trang vượt quá kết quả, đưa người dùng về một trang còn dữ liệu.
export function Pagination({ meta, toPage }) {
  if (!meta || (meta.totalPages <= 1 && meta.page === 1)) return null
  if (meta.page > meta.totalPages) {
    const target = Math.max(meta.totalPages, 1)
    return (
      <nav className="actions" aria-label="Phân trang">
        <Button variant="secondary" to={toPage(target)}>
          {target === 1 ? 'Về trang đầu' : 'Về trang cuối'}
        </Button>
      </nav>
    )
  }
  return (
    <nav className="actions" aria-label="Phân trang">
      {meta.page > 1 && (
        <Button variant="secondary" to={toPage(meta.page - 1)}>
          Trang trước
        </Button>
      )}
      <span>
        Trang {meta.page}
        {meta.totalPages > 0 ? ' / ' + meta.totalPages : ''}
      </span>
      {meta.page < meta.totalPages && (
        <Button variant="secondary" to={toPage(meta.page + 1)}>
          Trang tiếp
        </Button>
      )}
    </nav>
  )
}
