import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../api/client.js';

export function StatusPill({ label, tone = 'neutral' }) {
  return <span className={`pill pill-${tone}`}>{label}</span>;
}
export function ProgressBar({ quantity = 0, completedQuantity = 0, label = 'Tiến độ' }) {
  const percent = quantity > 0 ? Math.max(0, Math.min(100, Math.round(completedQuantity / quantity * 100))) : 0;
  return <div className="progress-wrap"><div className="progress-head"><span>{label}</span><strong>{percent}%</strong></div>
    <div className="progress-track" role="progressbar" aria-label={label} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${percent}%` }} /></div></div>;
}
export function Loading({ message = 'Đang tải dữ liệu…' }) {
  return <div className="state-box" role="status"><span className="spinner" aria-hidden="true" />{message}</div>;
}
export function Empty({ title = 'Chưa có dữ liệu', detail, action, to }) {
  return <div className="state-box empty-state"><span className="empty-symbol" aria-hidden="true">✦</span>
    <h3>{title}</h3>{detail && <p>{detail}</p>}{action && to && <Link to={to} className="btn btn-primary">{action}</Link>}</div>;
}
export function ErrorState({ error, retry }) {
  return <div className="state-box error-state" role="alert"><h3>Không tải được dữ liệu</h3>
    <p>{error?.message || 'Hãy kiểm tra kết nối và thử lại.'}</p>{retry && <button type="button" className="btn btn-outline" onClick={retry}>Thử lại</button>}</div>;
}
export function InlineError({ error }) { return error ? <p className="inline-error" role="alert">{error.message || String(error)}</p> : null; }
export function PageHeading({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>;
}
export function Field({ label, id, required, error, children, hint }) {
  return <div className="field"><label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
    {children}{hint && <small>{hint}</small>}{error && <small role="alert" className="field-error">{error}</small>}</div>;
}
export function SubmitButton({ busy, children, variant = 'primary', disabled }) {
  return <button className={`btn btn-${variant}`} type="submit" disabled={busy || disabled}>{busy ? 'Đang xử lý…' : children}</button>;
}
export function Dialog({ title, children, pending, confirmText = 'Xác nhận', onConfirm, onClose, danger = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog.open) dialog.showModal();
    return () => { if (dialog.open) dialog.close(); };
  }, []);
  return <dialog ref={ref} className="modal" onCancel={(event) => { if (pending) event.preventDefault(); else onClose(); }}
    onClose={() => { if (!pending) onClose(); }} aria-labelledby="modal-heading">
    <h2 id="modal-heading">{title}</h2><div className="modal-body">{children}</div>
    <div className="dialog-actions"><button className="btn btn-outline" type="button" disabled={pending} onClick={onClose}>Hủy</button>
      <button className={`btn btn-${danger ? 'danger' : 'primary'}`} type="button" disabled={pending} onClick={onConfirm}>{pending ? 'Đang xử lý…' : confirmText}</button></div>
  </dialog>;
}
export function Pagination({ meta, onPage }) {
  if (!meta || meta.totalPages <= 1) return null;
  return <nav className="pagination" aria-label="Phân trang"><button className="btn btn-outline" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Trước</button>
    <span>Trang {meta.page} / {meta.totalPages}</span><button className="btn btn-outline" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>Sau</button></nav>;
}
export function useAsyncData(load, deps = []) {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({ loading: true, data: null, error: null });
  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));
    Promise.resolve().then(() => load(controller.signal)).then((value) => {
      if (!controller.signal.aborted) setState({ loading: false, data: value, error: null });
    }).catch((error) => {
      if (!controller.signal.aborted && error?.name !== 'AbortError') setState({ loading: false, data: null, error });
    });
    return () => controller.abort();
    // Callers pass stable dependency values (IDs, filters). The effect deliberately uses these values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { ...state, retry: () => setTick((n) => n + 1) };
}
export function FieldErrors(error) {
  if (!(error instanceof ApiError) || error.code !== 'VALIDATION_ERROR') return {};
  return Object.fromEntries(error.details.map((issue) => [issue.field, issue.message]));
}
