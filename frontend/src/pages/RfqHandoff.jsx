import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../api/client.js'
import { useResource } from '../api/useResource.js'
import { Button, Field, Resource } from '../components/UI.jsx'

function RequestForm({ product }) {
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState(null)
  const [saved, setSaved] = useState(null)
  const errors = Object.fromEntries(
    (failure?.details ?? []).map(({ field, message }) => [field, message]),
  )
  async function submit(event) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget))
    if (
      !data.title.trim() ||
      !data.description.trim() ||
      !data.deliveryAddress.trim() ||
      !data.unit.trim()
    ) {
      setFailure(new Error('Điền đủ các thông tin đơn hàng.'))
      return
    }
    setBusy(true)
    setFailure(null)
    try {
      const { data: draft } = await apiFetch('/rfqs', {
        method: 'POST',
        body: {
          title: data.title.trim(),
          categoryId: product.category.id,
          referenceProductId: product.id,
          description: data.description.trim(),
          quantity: Number(data.quantity),
          unit: data.unit.trim(),
          ...(data.budgetMax ? { budgetMax: data.budgetMax } : {}),
          bidDeadline: new Date(data.bidDeadline).toISOString(),
          requiredBy: data.requiredBy,
          deliveryAddress: data.deliveryAddress.trim(),
        },
      })
      setSaved(draft)
    } catch (error) {
      setFailure(error)
    } finally {
      setBusy(false)
    }
  }
  if (saved) return <p role="status">Đã lưu RFQ nháp {saved.code || saved.id}.</p>
  return (
    <form className="panel stack" onSubmit={submit}>
      <h2>Thông tin yêu cầu</h2>
      <Field label="Tiêu đề" error={errors.title}>
        {(props) => (
          <input
            {...props}
            required
            name="title"
            maxLength="255"
            defaultValue={'Báo giá ' + product.name}
          />
        )}
      </Field>
      <Field label="Mô tả yêu cầu" error={errors.description}>
        {(props) => <textarea {...props} required name="description" rows="4" maxLength="10000" />}
      </Field>
      <Field label="Số lượng" error={errors.quantity}>
        {(props) => (
          <input
            {...props}
            type="number"
            min="1"
            max="1000000000"
            step="1"
            required
            name="quantity"
          />
        )}
      </Field>
      <Field label="Đơn vị" error={errors.unit}>
        {(props) => <input {...props} required name="unit" maxLength="50" defaultValue="chiếc" />}
      </Field>
      <Field label="Ngân sách tối đa (VND)" error={errors.budgetMax}>
        {(props) => <input {...props} type="number" min="0" step="0.01" name="budgetMax" />}
      </Field>
      <Field label="Hạn nhận báo giá" error={errors.bidDeadline}>
        {(props) => <input {...props} type="datetime-local" required name="bidDeadline" />}
      </Field>
      <Field label="Ngày cần hàng" error={errors.requiredBy}>
        {(props) => <input {...props} type="date" required name="requiredBy" />}
      </Field>
      <Field label="Địa chỉ giao hàng" error={errors.deliveryAddress}>
        {(props) => <input {...props} required name="deliveryAddress" maxLength="400" />}
      </Field>
      {failure && (
        <p className="error" role="alert">
          {failure.status === 404
            ? 'Bản chạy này chưa có API lưu RFQ của Người 1. Thông tin bạn nhập vẫn còn trên form.'
            : failure.message}
        </p>
      )}
      <div>
        <Button type="submit" disabled={busy}>
          {busy ? 'Đang lưu…' : 'Lưu yêu cầu nháp'}
        </Button>
      </div>
    </form>
  )
}

function ReferencedRequest({ slug, referenceId }) {
  const state = useResource('/products/' + encodeURIComponent(slug))
  return (
    <Resource state={state}>
      {(product) =>
        product.id !== referenceId ? (
          <p className="error" role="alert">
            Tham chiếu sản phẩm đã thay đổi. Mở lại từ trang chi tiết.
          </p>
        ) : (
          <>
            <section className="panel">
              <h2>Sản phẩm tham khảo</h2>
              <p>
                <Link to={'/san-pham/' + product.slug}>{product.name}</Link>
              </p>
              <p>
                Xưởng <Link to={'/xuong/' + product.workshop.slug}>{product.workshop.name}</Link>
              </p>
              <p>Danh mục {product.category.name}</p>
            </section>
            <RequestForm key={product.id} product={product} />
          </>
        )
      }
    </Resource>
  )
}

export function RfqHandoff() {
  const [params] = useSearchParams()
  const slug = params.get('productSlug')
  const referenceId = params.get('referenceProductId')
  return (
    <div className="container narrow section stack">
      <h1>Yêu cầu báo giá</h1>
      {slug && referenceId ? (
        <ReferencedRequest slug={slug} referenceId={referenceId} />
      ) : (
        <p>
          Chọn sản phẩm từ <Link to="/kham-pha">trang khám phá</Link> để tạo yêu cầu có tham chiếu.
        </p>
      )}
    </div>
  )
}
