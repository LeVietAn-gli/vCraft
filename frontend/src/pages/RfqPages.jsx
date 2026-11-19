import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../api/client.js';
import { buyerApi } from '../api/buyer.api.js';
import { Dialog, Empty, ErrorState, Field, FieldErrors, InlineError, Loading, PageHeading, Pagination, StatusPill, SubmitButton, useAsyncData } from '../components/UI.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { date, dateTime, money, number, rfqLabel, planLabel, nextStep } from '../utils/format.js';

const rfqStates = ['', 'DRAFT', 'SENT', 'BIDDING', 'ACCEPTED', 'IN_PRODUCTION', 'DELIVERED'];
function toneForRfq(status) { return status === 'DELIVERED' ? 'success' : status === 'DRAFT' ? 'neutral' : status === 'BIDDING' ? 'warn' : 'blue'; }
export function BuyerRfqsPage() {
  const [search, setSearch] = useSearchParams();
  const status = search.get('status') || '';
  const page = Math.max(1, Number(search.get('page')) || 1);
  const resource = useAsyncData(() => buyerApi.rfqs({ status, page, limit: 10 }), [status, page]);
  return <div className="container padded"><PageHeading eyebrow="Không gian Buyer" title="Yêu cầu báo giá" description="Quản lý các đơn đặt hàng sỉ và theo dõi từng bước xử lý."
    action={<Link to="/buyer/rfqs/moi" className="btn btn-primary">+ Tạo yêu cầu mới</Link>} />
    <div className="filter-row"><label htmlFor="rfq-status">Lọc trạng thái</label><select id="rfq-status" value={status} onChange={(e) => setSearch({ ...(e.target.value ? { status: e.target.value } : {}), page: '1' })}>
      {rfqStates.map((s) => <option key={s} value={s}>{s ? rfqLabel[s] : 'Tất cả trạng thái'}</option>)}</select></div>
    {resource.loading ? <Loading /> : resource.error ? <ErrorState error={resource.error} retry={resource.retry} /> :
      resource.data?.data.length ? <><div className="rfq-list">{resource.data.data.map((rfq) => <article className="rfq-card" key={rfq.id}>
        <div className="rfq-card-top"><span className="code-label">{rfq.code}</span><StatusPill label={rfqLabel[rfq.status]} tone={toneForRfq(rfq.status)} /></div>
        <h2><Link to={`/buyer/rfqs/${rfq.id}`}>{rfq.title}</Link></h2>
        <div className="meta-row"><span>{number(rfq.quantity)} {rfq.unit}</span><span>{rfq.category?.name || 'Danh mục'}</span><span>Ngày tạo: {date(rfq.createdAt)}</span></div>
        <div className="rfq-card-bottom"><p><strong>Tiếp theo:</strong> {nextStep(rfq)}</p>
          <Link className="text-link" to={rfq.status === 'DRAFT' ? `/buyer/rfqs/${rfq.id}/sua` : `/buyer/rfqs/${rfq.id}`}>
            {rfq.status === 'DRAFT' ? 'Tiếp tục chỉnh sửa' : 'Xem chi tiết'} →</Link></div></article>)}</div>
        <Pagination meta={resource.data.meta} onPage={(p) => setSearch({ ...(status ? { status } : {}), page: String(p) })} /></> :
        <Empty title="Chưa có yêu cầu nào" detail="Tạo một yêu cầu mới để các xưởng thủ công gửi báo giá." to="/buyer/rfqs/moi" action="Tạo yêu cầu đầu tiên" />}
  </div>;
}
const blank = { title: '', categoryId: '', referenceProductId: '', description: '', quantity: '', unit: 'chiếc',
  budgetMax: '', bidDeadline: '', requiredBy: '', contactName: '', contactPhone: '', deliveryAddress: '' };
function asDatetimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
export function RfqEditorPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const [params] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fields, setFields] = useState({ ...blank, contactName: user?.fullName || '', contactPhone: user?.phone || '' });
  const [categories, setCategories] = useState([]);
  const [reference, setReference] = useState(null);
  const [status, setStatus] = useState('DRAFT');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    let alive = true;
    Promise.all([buyerApi.categories(), ...(editing ? [buyerApi.rfq(id)] : [])]).then(async (results) => {
      if (!alive) return;
      setCategories(results[0].data);
      if (editing) {
        const rfq = results[1].data;
        setStatus(rfq.status);
        setFields({ title: rfq.title, categoryId: rfq.categoryId, referenceProductId: rfq.referenceProductId || '',
          description: rfq.description || '', quantity: String(rfq.quantity), unit: rfq.unit,
          budgetMax: rfq.budgetMax || '', bidDeadline: asDatetimeLocal(rfq.bidDeadline),
          requiredBy: rfq.requiredBy?.slice(0, 10) || '', contactName: rfq.contactName,
          contactPhone: rfq.contactPhone || '', deliveryAddress: rfq.deliveryAddress });
        if (rfq.referenceProduct) setReference(rfq.referenceProduct);
      } else if (params.get('sanPham')) {
        try {
          const res = await apiFetch(`/products/${encodeURIComponent(params.get('sanPham'))}`);
          if (alive) { setReference(res.data);setFields((prev) => ({ ...prev,
            referenceProductId: res.data.id, categoryId: res.data.categoryId,
            title: `Đặt sản xuất ${res.data.name}` })); }
        } catch { /* Optional reference, editable without a product. */ }
      }
    }).catch((e) => alive && setLoadError(e)).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id, editing, params.get('sanPham')]);
  const set = (key, value) => setFields((prev) => ({ ...prev, [key]: value }));
  const locked = status !== 'DRAFT';
  const editable = ['DRAFT', 'SENT', 'BIDDING'].includes(status);
  const errors = FieldErrors(error);
  async function save(event, send = false) {
    event?.preventDefault();
    if (!editable || busy) return;
    setBusy(true);setError(null);
    try {
      const input = locked ? { contactName: fields.contactName, contactPhone: fields.contactPhone || null,
        deliveryAddress: fields.deliveryAddress } : {
        title: fields.title.trim(), categoryId: fields.categoryId,
        referenceProductId: fields.referenceProductId || null,
        description: fields.description || null,
        quantity: Number(fields.quantity), unit: fields.unit.trim(),
        budgetMax: fields.budgetMax === '' ? null : fields.budgetMax,
        bidDeadline: fields.bidDeadline ? new Date(fields.bidDeadline).toISOString() : '',
        requiredBy: fields.requiredBy, contactName: fields.contactName,
        contactPhone: fields.contactPhone || null, deliveryAddress: fields.deliveryAddress,
      };
      const result = editing ? await buyerApi.updateRfq(id, input) : await buyerApi.createRfq(input);
      if (send && !locked) {
        try { await buyerApi.sendRfq(result.data.id); }
        catch (sendError) {
          // The draft was committed even though sending failed; keep its ID to prevent duplicates.
          if (!editing) navigate(`/buyer/rfqs/${result.data.id}`, { replace: true, state: { sendError: sendError.message } });
          else setError(sendError);
          return;
        }
      }
      navigate(`/buyer/rfqs/${result.data.id}`, { replace: true });
    } catch (e) { setError(e); } finally { setBusy(false); }
  }
  if (loading) return <div className="container padded"><Loading /></div>;
  if (loadError) return <div className="container padded"><ErrorState error={loadError} retry={() => navigate(0)} /></div>;
  return <div className="container padded"><PageHeading eyebrow="Không gian Buyer" title={editing ? 'Chỉnh sửa yêu cầu' : 'Tạo yêu cầu báo giá'}
    description="Mô tả nhu cầu mua sỉ để các xưởng phù hợp có thể chào giá chính xác." />
    {!editable && <div className="notice warn">Yêu cầu đã được chốt và không còn cho phép chỉnh sửa.</div>}
    {locked && editable && <div className="notice">Sau khi gửi, chỉ được thay đổi thông tin liên hệ và địa chỉ giao hàng.</div>}
    <form className="editor-form" onSubmit={(e) => save(e, e.nativeEvent?.submitter?.value === 'send')}>
      <section className="form-section"><p className="eyebrow">01 / Sản phẩm</p><h2>Bạn muốn đặt làm gì?</h2>
        {reference && <p className="reference-note">Sản phẩm tham khảo: <Link to={`/san-pham/${reference.slug}`}>{reference.name}</Link></p>}
        <div className="form-grid"><Field id="rfq-title" label="Tiêu đề yêu cầu" required error={errors.title}><input id="rfq-title" value={fields.title} onChange={(e) => set('title', e.target.value)} required minLength={5} maxLength={200} disabled={locked || !editable} placeholder="VD: 5.000 cốc sứ in logo" /></Field>
          <Field id="rfq-category" label="Danh mục" required error={errors.categoryId}><select id="rfq-category" required value={fields.categoryId} onChange={(e) => set('categoryId', e.target.value)} disabled={locked || !editable}>
            <option value="">Chọn danh mục</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field></div>
        <Field id="rfq-description" label="Mô tả chi tiết" error={errors.description}><textarea id="rfq-description" rows={4} maxLength={5000} value={fields.description} onChange={(e) => set('description', e.target.value)} disabled={locked || !editable} placeholder="Chất liệu, kích thước, logo, màu men, yêu cầu đóng gói..." /></Field></section>
      <section className="form-section"><p className="eyebrow">02 / Khối lượng & thời hạn</p><h2>Số lượng và ngân sách</h2>
        <div className="form-grid form-grid-3"><Field id="rfq-quantity" label="Số lượng" required error={errors.quantity}><input id="rfq-quantity" type="number" min="1" max="100000000" step="1" value={fields.quantity} onChange={(e) => set('quantity', e.target.value)} required disabled={locked || !editable} /></Field>
          <Field id="rfq-unit" label="Đơn vị" required error={errors.unit}><input id="rfq-unit" value={fields.unit} onChange={(e) => set('unit', e.target.value)} required disabled={locked || !editable} /></Field>
          <Field id="rfq-budget" label="Ngân sách tối đa (VND)" error={errors.budgetMax}><input id="rfq-budget" type="number" min="0" step="0.01" value={fields.budgetMax} onChange={(e) => set('budgetMax', e.target.value)} disabled={locked || !editable} placeholder="Không bắt buộc" /></Field></div>
        <div className="form-grid"><Field id="rfq-bid-date" label="Hạn nhận báo giá" required error={errors.bidDeadline}><input id="rfq-bid-date" type="datetime-local" required value={fields.bidDeadline} onChange={(e) => set('bidDeadline', e.target.value)} disabled={locked || !editable} /></Field>
          <Field id="rfq-required" label="Ngày cần nhận hàng" required error={errors.requiredBy}><input id="rfq-required" type="date" required value={fields.requiredBy} onChange={(e) => set('requiredBy', e.target.value)} disabled={locked || !editable} /></Field></div></section>
      <section className="form-section"><p className="eyebrow">03 / Liên hệ & giao hàng</p><h2>Thông tin nhận hàng</h2>
        <div className="form-grid"><Field id="rfq-name" label="Người liên hệ" required error={errors.contactName}><input id="rfq-name" value={fields.contactName} onChange={(e) => set('contactName', e.target.value)} required disabled={!editable} /></Field>
          <Field id="rfq-phone" label="Số điện thoại" error={errors.contactPhone}><input id="rfq-phone" type="tel" value={fields.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} disabled={!editable} /></Field></div>
        <Field id="rfq-delivery" label="Địa chỉ giao hàng" required error={errors.deliveryAddress}><input id="rfq-delivery" value={fields.deliveryAddress} onChange={(e) => set('deliveryAddress', e.target.value)} minLength={5} maxLength={300} required disabled={!editable} /></Field></section>
      <InlineError error={error} />
      <div className="form-actions"><Link className="btn btn-outline" to={editing ? `/buyer/rfqs/${id}` : '/buyer/rfqs'}>Quay lại</Link>
        {editable && <><SubmitButton busy={busy}>{locked ? 'Lưu thông tin liên hệ' : 'Lưu nháp'}</SubmitButton>
          {!locked && <button type="submit" name="action" value="send" className="btn btn-accent" disabled={busy}>Lưu và gửi yêu cầu →</button>}</>}</div>
    </form>
  </div>;
}
export function RfqDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const resource = useAsyncData(async () => {
    const rfq = (await buyerApi.rfq(id)).data;
    const [bids, plan] = await Promise.all([
      buyerApi.bids(id).then((r) => ({ data: r.data })).catch((e) => ({ data: null, error: e })),
      buyerApi.plan(id).then((r) => ({ data: r.data })).catch((e) => ({ data: null, error: e.status === 404 ? null : e })),
    ]);
    return { rfq, bids, plan };
  }, [id]);
  const [action, setAction] = useState('');
  const [sending, setSending] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  async function sendDraft() {
    if (sending) return;
    setSending(true);setError(null);
    try { await buyerApi.sendRfq(id);navigate(location.pathname, { replace: true, state: null });resource.retry(); }
    catch (e) { setError(e); }
    finally { setSending(false); }
  }
  async function decide() {
    setBusy(true);setError(null);
    try {
      if (action === 'accept') {
        const response = await buyerApi.accept(resource.data.plan.data.id);
        setAction('');navigate(`/buyer/don-hang/${response.data.order.id}`, { replace: true });
      } else { await buyerApi.reject(resource.data.plan.data.id, reason);setAction('');resource.retry(); }
    } catch (e) { setError(e); } finally { setBusy(false); }
  }
  if (resource.loading) return <div className="container padded"><Loading /></div>;
  if (resource.error) return <div className="container padded"><ErrorState error={resource.error} retry={resource.retry} /></div>;
  const { rfq, bids, plan } = resource.data;
  return <div className="container padded"><Link className="back-link" to="/buyer/rfqs">← Danh sách yêu cầu</Link>
    {location.state?.sendError && <div className="notice warn" role="alert">RFQ đã lưu nháp nhưng chưa gửi: {location.state.sendError}. Kiểm tra lại rồi thử gửi hoặc sửa yêu cầu.</div>}
    <PageHeading eyebrow={rfq.code} title={rfq.title} description={`${number(rfq.quantity)} ${rfq.unit} · Hạn giao ${date(rfq.requiredBy)}`}
      action={<StatusPill label={rfqLabel[rfq.status]} tone={toneForRfq(rfq.status)} />} />
    <div className="workflow-steps" aria-label="Tiến trình RFQ">{['DRAFT', 'SENT', 'BIDDING', 'ACCEPTED', 'IN_PRODUCTION', 'DELIVERED'].map((step, index) => <span key={step} className={['DRAFT', 'SENT', 'BIDDING', 'ACCEPTED', 'IN_PRODUCTION', 'DELIVERED'].indexOf(rfq.status) >= index ? 'reached' : ''}>{rfqLabel[step]}</span>)}</div>
    <div className="details-grid"><div className="detail-primary"><section className="surface"><div className="section-header"><h2>Chi tiết yêu cầu</h2>{['DRAFT', 'SENT', 'BIDDING'].includes(rfq.status) && <Link className="text-link" to={`/buyer/rfqs/${id}/sua`}>Chỉnh sửa →</Link>}</div>
      <p>{rfq.description || 'Không có mô tả bổ sung.'}</p><dl className="definition-grid"><div><dt>Danh mục</dt><dd>{rfq.category?.name}</dd></div><div><dt>Số lượng</dt><dd>{number(rfq.quantity)} {rfq.unit}</dd></div>
        <div><dt>Ngân sách</dt><dd>{money(rfq.budgetMax)}</dd></div><div><dt>Hạn nhận báo giá</dt><dd>{dateTime(rfq.bidDeadline)}</dd></div>
        <div><dt>Người liên hệ</dt><dd>{rfq.contactName}</dd></div><div><dt>Số điện thoại</dt><dd>{rfq.contactPhone || 'Chưa có'}</dd></div><div className="full"><dt>Địa chỉ giao</dt><dd>{rfq.deliveryAddress}</dd></div></dl></section>
      <section className="surface"><h2>Xưởng được mời <span className="muted">({rfq.invitations?.length || 0})</span></h2>
        {rfq.invitations?.length ? <ul className="lined-list">{rfq.invitations.map((inv) => <li key={inv.id}><span><Link to={`/xuong/${inv.workshop.slug}`}>{inv.workshop.name}</Link></span><StatusPill label={inv.status === 'BID_SUBMITTED' ? 'Đã báo giá' : inv.status === 'VIEWED' ? 'Đã xem' : 'Đã mời'} tone={inv.status === 'BID_SUBMITTED' ? 'success' : 'neutral'} /></li>)}</ul> : <p className="muted">Yêu cầu chưa được gửi tới các xưởng.</p>}
      </section>
      <section className="surface"><h2>So sánh báo giá</h2>
        {bids.error ? <ErrorState error={bids.error} retry={resource.retry} /> : bids.data?.length ? <div className="table-scroll"><table><thead><tr><th>Xưởng</th><th>Số lượng</th><th>Đơn giá</th><th>Thời gian</th><th>Trạng thái</th></tr></thead><tbody>
          {bids.data.map((bid) => <tr key={bid.id}><td><Link to={`/xuong/${bid.workshop.slug}`}>{bid.workshop.name}</Link><small>{bid.note}</small></td><td>{number(bid.quantityOffered)}</td><td>{money(bid.unitPrice)}</td><td>{bid.leadTimeDays} ngày</td><td>{bid.status === 'SUBMITTED' ? 'Đã gửi' : bid.status === 'ACCEPTED' ? 'Được chọn' : 'Không được chọn'}</td></tr>)}</tbody></table></div> : <p className="muted">Các xưởng chưa gửi báo giá. Bạn có thể kiểm tra lại sau.</p>}
      </section>
      <section className="surface"><h2>Phương án điều phối</h2>
        {plan.error ? <ErrorState error={plan.error} retry={resource.retry} /> : plan.data ? <>
          <div className="section-header"><p>Ban quản lý đề xuất phân chia khối lượng cho các xưởng dưới đây.</p><StatusPill label={planLabel[plan.data.status]} tone={plan.data.status === 'PENDING_BUYER' ? 'warn' : plan.data.status === 'ACCEPTED' ? 'success' : 'neutral'} /></div>
          <div className="table-scroll"><table><thead><tr><th>Xưởng</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th><th>Hạn hoàn thành</th></tr></thead><tbody>
            {plan.data.items.map((it) => <tr key={it.id}><td><Link to={`/xuong/${it.workshop.slug}`}>{it.workshop.name}</Link></td><td>{number(it.quantity)}</td><td>{money(it.unitPrice)}</td><td>{money(it.lineTotal)}</td><td>{date(it.dueDate)}</td></tr>)}</tbody></table></div>
          <div className="plan-total"><span>Tổng số lượng: <strong>{number(plan.data.totalQuantity)} {rfq.unit}</strong></span><span>Tổng giá trị: <strong>{money(plan.data.totalAmount)}</strong></span></div>
          {plan.data.status === 'REJECTED' && plan.data.rejectReason && <p>Lý do từ chối: {plan.data.rejectReason}</p>}
          {plan.data.status === 'PENDING_BUYER' && <div className="button-group"><button className="btn btn-primary" onClick={() => setAction('accept')}>Chấp nhận phương án</button>
            <button className="btn btn-outline" onClick={() => { setReason('');setAction('reject'); }}>Từ chối</button></div>}
        </> : <p className="muted">Chưa có phương án được gửi cho bạn.</p>}
      </section></div><aside className="detail-side"><div className="surface tint"><p className="eyebrow">Bước tiếp theo</p><h2>{nextStep(rfq)}</h2>
        <p>Yêu cầu báo giá được thực hiện qua Ban quản lý và các xưởng phù hợp.</p>
        {rfq.status === 'DRAFT' && <button className="btn btn-accent" disabled={sending} onClick={sendDraft}>{sending ? 'Đang gửi…' : 'Gửi yêu cầu →'}</button>}
        {rfq.order?.id && <Link className="btn btn-primary" to={`/buyer/don-hang/${rfq.order.id}`}>Xem đơn hàng</Link>}
        <InlineError error={error} /></div></aside></div>
    {action && <Dialog title={action === 'accept' ? 'Xác nhận chấp nhận phương án' : 'Từ chối phương án'} pending={busy} onClose={() => !busy && setAction('')} onConfirm={decide} confirmText={action === 'accept' ? 'Chấp nhận và tạo đơn' : 'Gửi từ chối'} danger={action === 'reject'}>
      {action === 'accept' ? <p>Bạn đồng ý đặt <strong>{number(plan.data.totalQuantity)} {rfq.unit}</strong> với tổng giá trị <strong>{money(plan.data.totalAmount)}</strong>. Đơn hàng sẽ được tạo và phân công cho các xưởng.</p> :
        <Field id="reject-reason" label="Lý do từ chối (không bắt buộc)"><textarea id="reject-reason" rows={3} value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} autoFocus placeholder="Ví dụ: Thời hạn giao chưa phù hợp" /></Field>}
      <InlineError error={error} /></Dialog>}
  </div>;
}
