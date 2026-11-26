import { Link, useSearchParams } from 'react-router-dom'
import { useResource } from '../api/useResource.js'
import { Pagination } from '../components/Pagination.jsx'
import { Button, Field, Resource } from '../components/UI.jsx'
import { Badge, currency, labels, orderPath, orderStates, rfqPath, rfqStates } from './BuyerUI.jsx'

function nextStep(rfq) {
  if (rfq.order?.status === 'READY') return 'Xác nhận đã nhận hàng'
  if (rfq.plans.length) return 'Duyệt phương án chia đơn'
  return {
    DRAFT: 'Hoàn thiện và gửi yêu cầu',
    SENT: 'Chờ xưởng báo giá',
    BIDDING: 'Xem báo giá của các xưởng',
    ACCEPTED: 'Theo dõi đơn hàng',
    IN_PRODUCTION: 'Xem tiến độ sản xuất',
    DELIVERED: 'Xem lại đơn đã nhận',
  }[rfq.status]
}
export function BuyerList({ orders = false }) {
  const [params, setParams] = useSearchParams()
  const path = orders ? orderPath : rfqPath
  const state = useResource((orders ? '/orders?' : '/rfqs?') + params)
  return (
    <>
      <header className="actions">
        <h1>{orders ? 'Đơn hàng của tôi' : 'Yêu cầu báo giá của tôi'}</h1>
        {!orders && <Button to={rfqPath + '/tao'}>Tạo yêu cầu báo giá</Button>}
      </header>
      <Field label="Lọc theo trạng thái">
        {(props) => (
          <select
            {...props}
            value={params.get('status') || ''}
            onChange={(e) => setParams(e.target.value ? { status: e.target.value } : {})}
          >
            <option value="">Tất cả trạng thái</option>
            {(orders ? orderStates : rfqStates).map((s) => (
              <option key={s} value={s}>
                {labels[s]}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Resource state={state}>
        {(rows) => (
          <>
            {!rows.length && (
              <p>{orders ? 'Chưa có đơn hàng phù hợp.' : 'Chưa có yêu cầu báo giá phù hợp.'}</p>
            )}
            {rows.map((row) => (
              <article className="panel buyerCard" key={row.id}>
                <p>
                  {row.code} · <Badge status={row.status} />
                </p>
                <h2>
                  <Link to={path + '/' + row.id}>{row.title || row.rfq.title}</Link>
                </h2>
                <p>
                  {orders
                    ? currency(row.totalAmount)
                    : row.quantity.toLocaleString('vi-VN') + ' ' + row.unit}
                </p>
                {!orders && (
                  <Link to={row.order ? orderPath + '/' + row.order.id : path + '/' + row.id}>
                    {nextStep(row)}
                  </Link>
                )}
              </article>
            ))}
            <Pagination
              meta={state.meta}
              toPage={(page) => {
                const next = new URLSearchParams(params)
                next.set('page', page)
                return path + '?' + next
              }}
            />
          </>
        )}
      </Resource>
    </>
  )
}
