import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { buyerApi } from '../api/buyer.api.js';
import { Dialog, Empty, ErrorState, InlineError, Loading, PageHeading, Pagination, ProgressBar, StatusPill, useAsyncData } from '../components/UI.jsx';
import { date, money, number, orderLabel, taskLabel } from '../utils/format.js';

const statuses = ['', 'IN_PRODUCTION', 'READY', 'DELIVERED'];
export function OrdersPage() {
  const [search, setSearch] = useSearchParams();
  const page = Math.max(1, Number(search.get('page')) || 1);
  const status = search.get('status') || '';
  const resource = useAsyncData(() => buyerApi.orders({ page, limit: 10, status }), [page, status]);
  return <div className="container padded"><PageHeading eyebrow="Không gian Buyer" title="Đơn hàng của tôi" description="Theo dõi tiến độ sản xuất từ từng xưởng cho tới ngày nhận hàng." />
    <div className="filter-row"><label htmlFor="order-status">Trạng thái</label><select id="order-status" value={status} onChange={(event) => setSearch({ ...(event.target.value ? { status: event.target.value } : {}), page: '1' })}>
      {statuses.map((s) => <option key={s} value={s}>{orderLabel[s] || 'Tất cả trạng thái'}</option>)}</select></div>
    {resource.loading ? <Loading /> : resource.error ? <ErrorState error={resource.error} retry={resource.retry} /> : resource.data.data.length ? <>
      <div className="rfq-list">{resource.data.data.map((order) => <article key={order.id} className="rfq-card"><div className="rfq-card-top"><span className="code-label">{order.code}</span>
        <StatusPill label={orderLabel[order.status]} tone={order.status === 'DELIVERED' ? 'success' : order.status === 'READY' ? 'warn' : 'blue'} /></div>
        <h2><Link to={`/buyer/don-hang/${order.id}`}>{order.rfq.title}</Link></h2><div className="meta-row"><span>{number(order.rfq.quantity)} {order.rfq.unit}</span><span>{money(order.totalAmount)}</span><span>Ngày tạo: {date(order.createdAt)}</span></div>
        <ProgressBar quantity={order.progress.quantity} completedQuantity={order.progress.completedQuantity} label="Tiến độ toàn đơn" />
        <div className="rfq-card-bottom"><p>{order.status === 'READY' ? 'Đã hoàn tất sản xuất — chờ bạn xác nhận nhận hàng' : order.status === 'DELIVERED' ? 'Đơn hàng đã hoàn tất' : 'Đang được các xưởng thực hiện'}</p>
          <Link className="text-link" to={`/buyer/don-hang/${order.id}`}>Xem chi tiết →</Link></div></article>)}</div>
      <Pagination meta={resource.data.meta} onPage={(p) => setSearch({ ...(status ? { status } : {}), page: String(p) })} /></> :
      <Empty title="Bạn chưa có đơn hàng" detail="Đơn hàng xuất hiện sau khi bạn chấp nhận phương án chia đơn của Ban quản lý." action="Xem yêu cầu báo giá" to="/buyer/rfqs" />}
  </div>;
}
export function OrderDetailPage() {
  const { id } = useParams();
  const resource = useAsyncData(() => buyerApi.order(id), [id]);
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  async function confirm() {
    setBusy(true);setError(null);
    try { await buyerApi.received(id);setModal(false);resource.retry(); }
    catch (e) { setError(e); } finally { setBusy(false); }
  }
  if (resource.loading) return <div className="container padded"><Loading /></div>;
  if (resource.error) return <div className="container padded"><ErrorState error={resource.error} retry={resource.retry} /></div>;
  const order = resource.data.data;
  return <div className="container padded"><Link className="back-link" to="/buyer/don-hang">← Tất cả đơn hàng</Link>
    <PageHeading eyebrow={order.code} title={order.rfq.title} description={`Đặt ngày ${date(order.createdAt)} · ${money(order.totalAmount)}`}
      action={<StatusPill label={orderLabel[order.status]} tone={order.status === 'DELIVERED' ? 'success' : order.status === 'READY' ? 'warn' : 'blue'} />} />
    <section className="surface progress-summary"><div><p className="eyebrow">Tổng quan</p><h2>{number(order.progress.completedQuantity)} / {number(order.progress.quantity)} {order.rfq.unit}</h2>
      <p>Cập nhật dựa trên khối lượng thực tế của từng xưởng, không chỉ số xưởng hoàn thành.</p></div>
      <ProgressBar quantity={order.progress.quantity} completedQuantity={order.progress.completedQuantity} label="Tiến độ toàn đơn" /></section>
    <div className="section-header spaced"><h2>Tiến độ theo xưởng</h2><span className="muted">{order.tasks.length} xưởng tham gia</span></div>
    <div className="task-grid">{order.tasks.map((task) => <article className="surface task-card" key={task.id}><div className="section-header"><h3><Link to={`/xuong/${task.workshop.slug}`}>{task.workshop.name}</Link></h3>
      <StatusPill label={taskLabel[task.status]} tone={task.status === 'COMPLETED' ? 'success' : task.status === 'IN_PROGRESS' ? 'blue' : 'neutral'} /></div>
      <p>{number(task.quantity)} {order.rfq.unit} · Hạn {date(task.dueDate)}</p>
      <ProgressBar quantity={task.quantity} completedQuantity={task.completedQuantity} label="Sản lượng hoàn thành" />
      {task.progressNote && <p className="progress-note">“{task.progressNote}”</p>}
      {task.batch?.isPublic && <Link className="text-link" to={`/truy-xuat/${task.batch.batchCode}`}>Xem nhật ký sản xuất →</Link>}
    </article>)}</div>
    <section className="surface receive-panel"><div><h2>{order.status === 'DELIVERED' ? 'Đã xác nhận nhận hàng' : order.status === 'READY' ? 'Đơn đã sẵn sàng bàn giao' : 'Đang chờ các xưởng hoàn thành'}</h2>
      <p>{order.status === 'DELIVERED' ? `Bạn xác nhận ngày ${date(order.receivedAt)}.` : order.status === 'READY' ? 'Chỉ xác nhận sau khi bạn thực sự đã nhận đầy đủ hàng từ các xưởng.' : 'Nút xác nhận nhận hàng sẽ xuất hiện khi toàn bộ nhiệm vụ hoàn thành.'}</p></div>
      {order.status === 'READY' && <button className="btn btn-primary" type="button" onClick={() => setModal(true)}>Xác nhận đã nhận hàng</button>}</section>
    {modal && <Dialog title="Xác nhận đã nhận hàng" pending={busy} confirmText="Tôi đã nhận đủ hàng" onClose={() => !busy && setModal(false)} onConfirm={confirm}>
      <p>Bạn xác nhận đã nhận đủ <strong>{number(order.progress.quantity)} {order.rfq.unit}</strong> của đơn <strong>{order.code}</strong>. Sau khi xác nhận, đơn sẽ chuyển sang trạng thái hoàn tất.</p><InlineError error={error} />
    </Dialog>}
  </div>;
}
