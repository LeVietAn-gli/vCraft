import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useResource } from '../api/useResource.js'
import { apiFetch } from '../api/client.js'
import { Button, Dialog, Field, Resource } from '../components/UI.jsx'
import {
  Badge,
  currency,
  date,
  instant,
  labels,
  orderPath,
  Progress,
  rfqPath,
  rfqStates,
} from './BuyerUI.jsx'

function DataTable({ name, columns, rows }) {
  return (
    <div className="buyerScroll" role="region" aria-label={name} tabIndex={0}>
      <table className="buyerTable" aria-label={name}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th scope="col" key={c}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ id, cells }) => (
            <tr key={id}>
              {cells.map((value, i) => (
                <td key={columns[i]}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
function BidTable({ bids }) {
  return (
    <section className="panel buyerCard">
      <h2>So sánh báo giá</h2>
      {bids.length ? (
        <DataTable
          name="So sánh báo giá"
          columns={['Xưởng', 'Cam kết', 'Đơn giá', 'Thành tiền', 'Thời gian', 'Ghi chú']}
          rows={bids.map((b) => ({
            id: b.id,
            cells: [
              b.workshop.name,
              b.quantityOffered,
              currency(b.unitPrice),
              currency(b.lineTotal),
              b.leadTimeDays + ' ngày',
              b.note || '—',
            ],
          }))}
        />
      ) : (
        <p>Chưa có báo giá từ xưởng.</p>
      )}
    </section>
  )
}
function Plan({ plan, onChange }) {
  const [action, setAction] = useState('')
  const [busy, setBusy] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  async function decide() {
    setBusy(true)
    setError('')
    try {
      const { data } = await apiFetch('/plans/' + plan.id + '/' + action, {
        method: 'POST',
        body: action === 'reject' ? { reason } : undefined,
      })
      if (action === 'accept') navigate(orderPath + '/' + data.order.id)
      else {
        setAction('')
        onChange()
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="panel stack buyerCard">
      <h2>Phương án chia đơn</h2>
      <p>
        <Badge status={plan.status} />
      </p>
      <DataTable
        name="Phân bổ theo xưởng"
        columns={['Xưởng', 'Số lượng', 'Đơn giá', 'Thành tiền', 'Hạn giao']}
        rows={plan.items.map((i) => ({
          id: i.id,
          cells: [
            i.workshop.name,
            i.quantity,
            currency(i.unitPrice),
            currency(i.lineTotal),
            date(i.dueDate),
          ],
        }))}
      />
      <p>
        Tổng số lượng <strong>{plan.totalQuantity}</strong> · Tổng tiền{' '}
        <strong>{currency(plan.totalAmount)}</strong>
      </p>
      {plan.rejectReason && <p>Lý do từ chối · {plan.rejectReason}</p>}
      {plan.status === 'PENDING_BUYER' && (
        <div className="actions">
          <Button
            onClick={() => {
              setError('')
              setAction('accept')
            }}
          >
            Chấp nhận
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setError('')
              setAction('reject')
            }}
          >
            Từ chối
          </Button>
        </div>
      )}
      {action && (
        <Dialog
          title={action === 'accept' ? 'Chấp nhận phương án?' : 'Từ chối phương án?'}
          close={() => {
            if (!busy) setAction('')
          }}
        >
          {action === 'accept' ? (
            <p>
              Đơn hàng sẽ được tạo với tổng giá trị <strong>{currency(plan.totalAmount)}</strong>.
            </p>
          ) : (
            <Field label="Lý do từ chối (tùy chọn)">
              {(props) => (
                <textarea
                  {...props}
                  maxLength={2000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              )}
            </Field>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <Button disabled={busy} onClick={decide}>
            {action === 'accept' ? 'Xác nhận đặt hàng' : 'Xác nhận từ chối'}
          </Button>
        </Dialog>
      )}
    </section>
  )
}
function SendDraft({ id, reload }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  async function send() {
    setBusy(true)
    setError('')
    try {
      await apiFetch('/rfqs/' + id + '/send', { method: 'POST' })
      reload()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <Button onClick={send} disabled={busy}>
        Gửi yêu cầu
      </Button>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </>
  )
}
export function RfqDetail() {
  const { id } = useParams(),
    state = useResource('/rfqs/' + id)
  return (
    <Resource state={state}>
      {(r) => (
        <>
          <Link to={rfqPath}>Yêu cầu của tôi</Link>
          <header>
            <p>
              {r.code} · <Badge status={r.status} />
            </p>
            <h1>{r.title}</h1>
            <ol aria-label="Các bước của yêu cầu" className="buyerSteps">
              {rfqStates.map((s) => (
                <li key={s} aria-current={s === r.status ? 'step' : undefined}>
                  {labels[s]}
                </li>
              ))}
            </ol>
          </header>
          <section className="panel stack buyerCard">
            <h2>Thông tin yêu cầu</h2>
            <p>{r.description}</p>
            <dl className="buyerInfo">
              {Object.entries({
                'Danh mục': r.category.name,
                'Số lượng': r.quantity + ' ' + r.unit,
                'Ngân sách': r.budgetMax == null ? 'Chưa đặt' : currency(r.budgetMax),
                'Hạn báo giá': instant(r.bidDeadline),
                'Ngày cần hàng': date(r.requiredBy),
                'Liên hệ': [r.contactName, r.contactPhone].filter(Boolean).join(' · '),
                'Địa chỉ giao': r.deliveryAddress,
              }).map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            {r.referenceProduct && (
              <Link to={'/san-pham/' + r.referenceProduct.slug}>{r.referenceProduct.name}</Link>
            )}
            <div className="actions">
              {['DRAFT', 'SENT', 'BIDDING'].includes(r.status) && (
                <Button variant="secondary" to={rfqPath + '/' + id + '/sua'}>
                  {r.status === 'DRAFT' ? 'Sửa bản nháp' : 'Sửa thông tin liên hệ'}
                </Button>
              )}
              {r.status === 'DRAFT' && <SendDraft id={id} reload={state.reload} />}
              {r.order && <Button to={orderPath + '/' + r.order.id}>Xem đơn hàng</Button>}
            </div>
          </section>
          {r.status !== 'DRAFT' && (
            <>
              <section className="panel">
                <h2>Xưởng được mời</h2>
                <ul>
                  {r.invitations.map((i) => (
                    <li key={i.id}>
                      <Link to={'/xuong/' + i.workshop.slug}>{i.workshop.name}</Link> ·{' '}
                      {labels[i.status]}
                    </li>
                  ))}
                </ul>
              </section>
              <BidTable bids={r.bids} />
              {r.plans[0] ? (
                <Plan plan={r.plans[0]} onChange={state.reload} />
              ) : (
                <p>Chưa có phương án chia đơn được gửi.</p>
              )}
            </>
          )}
        </>
      )}
    </Resource>
  )
}
function Receipt({ order, reload }) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  async function receive() {
    setBusy(true)
    setError('')
    try {
      await apiFetch('/orders/' + order.id + '/confirm-received', { method: 'POST' })
      setOpen(false)
      reload()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div>
      <Button onClick={() => setOpen(true)}>Xác nhận đã nhận hàng</Button>
      {open && (
        <Dialog
          title="Bạn đã nhận đủ hàng?"
          close={() => {
            if (!busy) setOpen(false)
          }}
        >
          <p>Xác nhận hoàn tất đơn {order.code}.</p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <Button onClick={receive} disabled={busy}>
            Đã nhận đủ hàng
          </Button>
        </Dialog>
      )}
    </div>
  )
}
export function OrderDetail() {
  const { id } = useParams(),
    state = useResource('/orders/' + id)
  return (
    <Resource state={state}>
      {(order) => (
        <>
          <Link to={orderPath}>Đơn hàng của tôi</Link>
          <header>
            <p>
              {order.code} · <Badge status={order.status} />
            </p>
            <h1>{order.rfq.title}</h1>
            <Link to={rfqPath + '/' + order.rfq.id}>Yêu cầu {order.rfq.code}</Link>
          </header>
          <section className="panel buyerCard">
            <h2>Tiến độ toàn đơn</h2>
            <Progress {...order.progress} unit={order.rfq.unit} />
            <p>
              Tổng tiền <strong>{currency(order.totalAmount)}</strong>
            </p>
            {order.receivedAt && <p>Đã nhận hàng lúc {instant(order.receivedAt)}</p>}
            {order.status === 'READY' && <Receipt order={order} reload={state.reload} />}
          </section>
          <h2>Tiến độ từng xưởng</h2>
          {order.tasks.map((t) => (
            <article key={t.id} className="panel buyerCard">
              <h3>
                <Link to={'/xuong/' + t.workshop.slug}>{t.workshop.name}</Link>
              </h3>
              <p>
                <Badge status={t.status} /> · Hạn giao {date(t.dueDate)}
              </p>
              <Progress
                completedQuantity={t.completedQuantity}
                quantity={t.quantity}
                unit={order.rfq.unit}
              />
              {t.progressNote && <p>{t.progressNote}</p>}
              {t.batchCode && (
                <Link to={'/truy-xuat/' + t.batchCode}>Nhật ký lô {t.batchCode}</Link>
              )}
            </article>
          ))}
        </>
      )}
    </Resource>
  )
}
