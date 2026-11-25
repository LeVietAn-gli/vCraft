// File này làm gì: Nhập thông tin lô và các sản phẩm kèm số lượng.
// Ai gọi file này: BatchEditor trước khi gửi POST hoặc PATCH.
import { useState } from 'react'
import { Button, Field } from '../components/UI.jsx'
import { BatchProducts } from './BatchProducts.jsx'
import { batchStates } from './BatchList.jsx'

// Giữ danh sách sản phẩm đang nhập khi server báo lỗi quyền hay dữ liệu.
export function BatchForm({ batch, busy, errors, submit }) {
  const [rows, setRows] = useState(() =>
    (batch?.products ?? []).map((row) => ({
      productId: row.productId,
      name: row.product.name,
      quantity: String(row.quantity),
    })),
  )

  // Đọc form trước khi khóa các ô trong thời gian chờ server.
  function save(event) {
    event.preventDefault()
    if (busy || !rows.length) return
    const form = new FormData(event.currentTarget)
    const body = {
      name: form.get('name'),
      description: form.get('description'),
      products: rows.map(({ productId, quantity }) => ({ productId, quantity: Number(quantity) })),
    }
    if (batch) {
      body.status = form.get('status')
      body.isPublic = form.has('isPublic')
    }
    submit(body)
  }

  return (
    <form className="panel stack" onSubmit={save}>
      <fieldset disabled={busy} className="stack">
        <legend>Thông tin lô</legend>
        <Field label="Tên lô" error={errors.name}>
          {(props) => (
            <input {...props} name="name" required maxLength="255" defaultValue={batch?.name} />
          )}
        </Field>
        <Field label="Mô tả lô" error={errors.description}>
          {(props) => (
            <textarea
              {...props}
              name="description"
              rows="4"
              maxLength="10000"
              defaultValue={batch?.description}
            />
          )}
        </Field>
        {batch && (
          <>
            <Field label="Trạng thái lô" error={errors.status}>
              {(props) => (
                <select {...props} name="status" defaultValue={batch.status}>
                  {Object.entries(batchStates).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <label className="actions">
              <input name="isPublic" type="checkbox" defaultChecked={batch.isPublic} /> Công khai
              truy xuất
            </label>
          </>
        )}
        {errors.products && (
          <p className="error" role="alert">
            {errors.products}
          </p>
        )}
        <BatchProducts rows={rows} setRows={setRows} />
        <div>
          <Button type="submit" disabled={busy || !rows.length}>
            {busy ? 'Đang lưu…' : 'Lưu lô'}
          </Button>
        </div>
      </fieldset>
    </form>
  )
}
