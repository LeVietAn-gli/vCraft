// File này làm gì: Hiển thị danh sách lô của nghệ nhân theo trang và trạng thái.
// Ai gọi file này: Route /nghe-nhan/lo-san-xuat.
import { useSearchParams } from 'react-router-dom'
import { useResource } from '../api/useResource.js'
import { Button, Resource } from '../components/UI.jsx'
import { Pagination } from '../components/Pagination.jsx'

export const batchPath = '/nghe-nhan/lo-san-xuat'
export const batchStates = {
  PLANNED: 'Kế hoạch',
  IN_PROGRESS: 'Đang sản xuất',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}

// Giữ query trạng thái khi chuyển trang để kết quả không bị mất lọc.
export function BatchList() {
  const [params] = useSearchParams()
  const state = useResource('/me/batches?' + params)
  return (
    <div className="container section stack">
      <h1>Lô sản xuất của xưởng</h1>
      <div>
        <Button to={batchPath + '/tao'}>Tạo lô</Button>
      </div>
      <nav className="actions" aria-label="Lọc trạng thái lô">
        <Button
          variant="secondary"
          to={batchPath}
          aria-current={!params.has('status') ? 'page' : undefined}
        >
          Tất cả
        </Button>
        {Object.entries(batchStates).map(([value, label]) => (
          <Button
            key={value}
            variant="secondary"
            to={batchPath + '?status=' + value}
            aria-current={params.get('status') === value ? 'page' : undefined}
          >
            {label}
          </Button>
        ))}
      </nav>
      <Resource state={state}>
        {(rows) => (
          <>
            {!rows.length && <p>Chưa có lô trong danh sách.</p>}
            {rows.map((row) => (
              <article key={row.id} className="panel">
                <h2>{row.name}</h2>
                <p>
                  {row.batchCode} · {batchStates[row.status]} ·{' '}
                  {row.isPublic ? 'Công khai' : 'Riêng tư'}
                </p>
                <Button
                  variant="secondary"
                  to={batchPath + '/' + row.id}
                  aria-label={'Quản lý ' + row.name}
                >
                  Quản lý lô
                </Button>
              </article>
            ))}
            <Pagination
              meta={state.meta}
              toPage={(page) => {
                const next = new URLSearchParams(params)
                next.set('page', page)
                return batchPath + '?' + next
              }}
            />
          </>
        )}
      </Resource>
    </div>
  )
}
