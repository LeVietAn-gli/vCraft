import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../api/client.js'
import { useResource } from '../api/useResource.js'
import { Button, Field, Resource } from '../components/UI.jsx'
import { useAccount } from '../buyer/Account.jsx'
import { Input, rfqPath } from '../buyer/BuyerUI.jsx'

function localDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
function RequestForm({ rfq, product }) {
  const { user } = useAccount()
  const categories = useResource('/categories')
  const navigate = useNavigate()
  const location = useLocation()
  const [failure, setFailure] = useState(
    location.state?.sendFailure ? new Error(location.state.sendFailure) : null,
  )
  const [busy, setBusy] = useState(false)
  const [useReference, setUseReference] = useState(Boolean(product || rfq?.referenceProductId))
  const locked = rfq && rfq.status !== 'DRAFT'
  const errors = Object.fromEntries((failure?.details || []).map((e) => [e.field, e.message]))
  async function submit(event) {
    event.preventDefault()
    const send = event.nativeEvent.submitter?.value === 'send'
    const values = Object.fromEntries(new FormData(event.currentTarget))
    const body = {
      contactName: values.contactName.trim(),
      contactPhone: values.contactPhone.trim(),
      deliveryAddress: values.deliveryAddress.trim(),
    }
    if (!locked) {
      const deadline = new Date(values.bidDeadline)
      if (deadline <= new Date() || new Date(values.requiredBy) <= deadline) {
        setFailure(new Error('Hạn báo giá phải ở tương lai và trước ngày cần hàng.'))
        return
      }
      Object.assign(body, {
        title: values.title.trim(),
        description: values.description.trim(),
        categoryId: values.categoryId || product?.category.id || rfq?.categoryId,
        referenceProductId: useReference ? product?.id || rfq?.referenceProductId : null,
        quantity: Number(values.quantity),
        unit: values.unit.trim(),
        budgetMax: values.budgetMax || null,
        bidDeadline: deadline.toISOString(),
        requiredBy: values.requiredBy,
      })
    }
    setBusy(true)
    setFailure(null)
    try {
      const { data } = await apiFetch(rfq ? '/rfqs/' + rfq.id : '/rfqs', {
        method: rfq ? 'PATCH' : 'POST',
        body,
      })
      if (send) {
        try {
          await apiFetch('/rfqs/' + data.id + '/send', { method: 'POST' })
        } catch (e) {
          if (!rfq)
            navigate(rfqPath + '/' + data.id + '/sua', {
              replace: true,
              state: { sendFailure: 'Đã lưu bản nháp. ' + e.message },
            })
          else setFailure(e)
          return
        }
      }
      navigate(rfqPath + '/' + data.id, { replace: true })
    } catch (e) {
      setFailure(e)
    } finally {
      setBusy(false)
    }
  }
  if (rfq && !['DRAFT', 'SENT', 'BIDDING'].includes(rfq.status))
    return (
      <p>
        Yêu cầu đã chốt. <Link to={rfqPath + '/' + rfq.id}>Xem chi tiết</Link>
      </p>
    )
  return (
    <Resource state={categories}>
      {(entries) => (
        <form className="panel stack buyerForm" onSubmit={submit}>
          {!locked && (
            <>
              <fieldset className="stack">
                <legend>Sản phẩm</legend>
                {useReference && product && (
                  <p>
                    Tham khảo <Link to={'/san-pham/' + product.slug}>{product.name}</Link> ·{' '}
                    <Link to={'/xuong/' + product.workshop.slug}>{product.workshop.name}</Link>
                  </p>
                )}
                {useReference && rfq?.referenceProduct && (
                  <p>Sản phẩm tham khảo · {rfq.referenceProduct.name}</p>
                )}
                {useReference && (
                  <div>
                    <Button variant="secondary" onClick={() => setUseReference(false)}>
                      Bỏ sản phẩm tham khảo
                    </Button>
                  </div>
                )}
                <Input
                  label="Tiêu đề"
                  name="title"
                  errors={errors}
                  required
                  maxLength={200}
                  defaultValue={rfq?.title || (product ? 'Báo giá ' + product.name : '')}
                />
                <Field label="Danh mục" error={errors.categoryId}>
                  {(props) => (
                    <select
                      {...props}
                      name="categoryId"
                      required
                      disabled={useReference}
                      defaultValue={product?.category.id || rfq?.categoryId || ''}
                    >
                      <option value="">Chọn danh mục</option>
                      {entries.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
                <Field label="Mô tả yêu cầu" error={errors.description}>
                  {(props) => (
                    <textarea
                      {...props}
                      name="description"
                      rows={4}
                      required
                      maxLength={10000}
                      defaultValue={rfq?.description}
                    />
                  )}
                </Field>
              </fieldset>
              <fieldset className="stack">
                <legend>Số lượng và thời hạn</legend>
                <Input
                  label="Số lượng"
                  name="quantity"
                  errors={errors}
                  type="number"
                  min={1}
                  max={2147483647}
                  step={1}
                  required
                  defaultValue={rfq?.quantity}
                />
                <Input
                  label="Đơn vị"
                  name="unit"
                  errors={errors}
                  maxLength={30}
                  required
                  defaultValue={rfq?.unit || 'chiếc'}
                />
                <Input
                  label="Ngân sách tối đa (VND, tùy chọn)"
                  name="budgetMax"
                  errors={errors}
                  type="number"
                  min="0"
                  max="9999999999.99"
                  step=".01"
                  defaultValue={rfq?.budgetMax}
                />
                <Input
                  label="Hạn nhận báo giá (giờ địa phương)"
                  name="bidDeadline"
                  errors={errors}
                  type="datetime-local"
                  required
                  defaultValue={localDateTime(rfq?.bidDeadline)}
                />
                <Input
                  label="Ngày cần hàng"
                  name="requiredBy"
                  errors={errors}
                  type="date"
                  required
                  defaultValue={rfq?.requiredBy?.slice(0, 10)}
                />
              </fieldset>
            </>
          )}
          <fieldset className="stack">
            <legend>Liên hệ và giao hàng</legend>
            <Input
              label="Người liên hệ"
              errors={errors}
              name="contactName"
              required
              maxLength={150}
              defaultValue={rfq?.contactName || user.fullName}
            />
            <Input
              label="Điện thoại"
              errors={errors}
              name="contactPhone"
              type="tel"
              required
              minLength={8}
              maxLength={20}
              defaultValue={rfq?.contactPhone || user.phone || ''}
            />
            <Input
              label="Địa chỉ giao hàng"
              errors={errors}
              name="deliveryAddress"
              required
              maxLength={300}
              defaultValue={rfq?.deliveryAddress}
            />
          </fieldset>
          {failure && (
            <p role="alert" className="error">
              {failure.message}
            </p>
          )}
          <div className="actions">
            <Button type="submit" variant="secondary" disabled={busy}>
              {locked ? 'Lưu liên hệ' : 'Lưu nháp'}
            </Button>
            {!locked && (
              <Button type="submit" value="send" disabled={busy}>
                Gửi yêu cầu
              </Button>
            )}
          </div>
        </form>
      )}
    </Resource>
  )
}
function Reference({ slug, id }) {
  const state = useResource('/products/' + encodeURIComponent(slug))
  return (
    <Resource state={state}>
      {(product) =>
        product.id === id ? (
          <RequestForm product={product} />
        ) : (
          <p role="alert">Tham chiếu sản phẩm đã thay đổi. Hãy chọn lại từ trang khám phá.</p>
        )
      }
    </Resource>
  )
}
function Edit({ id }) {
  const state = useResource('/rfqs/' + encodeURIComponent(id))
  return <Resource state={state}>{(rfq) => <RequestForm key={rfq.id} rfq={rfq} />}</Resource>
}
export function RfqHandoff() {
  const { id } = useParams()
  const [query] = useSearchParams()
  const slug = query.get('productSlug'),
    ref = query.get('referenceProductId')
  return (
    <div className="narrow stack">
      <Link to={rfqPath}>Yêu cầu của tôi</Link>
      <h1>{id ? 'Chỉnh sửa yêu cầu' : 'Tạo yêu cầu báo giá'}</h1>
      {id ? <Edit id={id} /> : slug && ref ? <Reference slug={slug} id={ref} /> : <RequestForm />}
    </div>
  )
}
