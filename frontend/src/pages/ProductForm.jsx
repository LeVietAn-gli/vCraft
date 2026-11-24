// File này làm gì: Nhập thông tin và chuẩn bị body để lưu sản phẩm.
// Ai gọi file này: ProductEditor khi tạo hoặc sửa sản phẩm.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Field } from '../components/UI.jsx'
import { ProductSpecifications } from './ProductSpecifications.jsx'

export const productStatusLabels = { HIDDEN: 'Ẩn', VISIBLE: 'Công khai' }

// Lưu cặp tên và giá trị theo thứ tự nhập. Báo lỗi trước khi tên trùng bị ghi đè.
function readSpecifications(rows) {
  const entries = new Map()
  for (const row of rows) {
    const name = row.key.trim()
    if (!name || entries.has(name)) return null
    entries.set(name, row.val.trim())
  }
  return Object.fromEntries(entries)
}

// Dùng giá trị sản phẩm làm mặc định và giữ nội dung khi API từ chối lưu.
export function ProductForm({ value, categories, busy, submit, errors }) {
  const [rows, setRows] = useState(() =>
    Object.entries(value?.specifications ?? {}).map(([key, val], id) => ({ key, val, id })),
  )
  const [rowError, setRowError] = useState('')

  // Tạo ID cao hơn những dòng hiện có để React giữ đúng từng ô.
  function addRow() {
    setRows((current) => {
      const id = (current.at(-1)?.id ?? -1) + 1
      return [...current, { id, key: '', val: '' }]
    })
  }

  // Cập nhật đúng dòng được sửa và cho phép kiểm tra lại ở lượt lưu sau.
  function setRow(id, field, content) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: content } : row)))
    setRowError('')
  }

  // Bỏ dòng đã chọn để người dùng có thể sửa lỗi tên trùng hoặc tên trống.
  function removeRow(id) {
    setRows((current) => current.filter((row) => row.id !== id))
    setRowError('')
  }

  // Lấy dữ liệu từ form trước khi khóa các trường trong thời gian chờ API.
  function save(event) {
    event.preventDefault()
    if (busy) return
    const data = new FormData(event.currentTarget)
    const specifications = readSpecifications(rows)
    if (!specifications) {
      setRowError('Điền tên khác nhau cho từng thông số hoặc bỏ dòng không cần dùng.')
      return
    }
    setRowError('')
    const price = data.get('price').trim().replace(',', '.')
    const body = {
      name: data.get('name'),
      categoryId: data.get('categoryId'),
      description: data.get('description'),
      price: price || null,
      specifications,
    }
    if (value) body.status = data.get('status')
    submit(body)
  }

  return (
    <form className="panel stack" onSubmit={save}>
      <fieldset disabled={busy} className="stack">
        <legend>Thông tin sản phẩm</legend>
        <Field label="Tên sản phẩm" error={errors.name}>
          {(props) => (
            <input {...props} name="name" required maxLength="255" defaultValue={value?.name} />
          )}
        </Field>
        <Field label="Danh mục" error={errors.categoryId}>
          {(props) => (
            <select {...props} name="categoryId" required defaultValue={value?.categoryId ?? ''}>
              <option value="">Chọn danh mục xưởng làm</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        {!categories.length && (
          <p>
            Hãy đăng ký danh mục trong <Link to="/nghe-nhan/ho-so">hồ sơ xưởng</Link>.
          </p>
        )}
        <Field label="Mô tả" error={errors.description}>
          {(props) => (
            <textarea
              {...props}
              name="description"
              rows="4"
              maxLength="10000"
              defaultValue={value?.description}
            />
          )}
        </Field>
        <Field label="Giá (VND, để trống nếu liên hệ báo giá)" error={errors.price}>
          {(props) => (
            <input
              {...props}
              name="price"
              inputMode="decimal"
              maxLength="13"
              defaultValue={value?.price ?? ''}
            />
          )}
        </Field>
        {value ? (
          <Field label="Trạng thái" error={errors.status}>
            {(props) => (
              <select {...props} name="status" defaultValue={value.status}>
                {Object.entries(productStatusLabels).map(([key, label]) => (
                  <option value={key} key={key}>
                    {label}
                  </option>
                ))}
              </select>
            )}
          </Field>
        ) : (
          <p className="muted">Sản phẩm mới ở trạng thái Ẩn. Lưu, tải ảnh rồi chọn Công khai.</p>
        )}
        <ProductSpecifications
          rows={rows}
          rowError={rowError}
          error={errors.specifications}
          addRow={addRow}
          removeRow={removeRow}
          setRow={setRow}
        />
        <div>
          <Button type="submit" disabled={busy || !categories.length}>
            Lưu sản phẩm
          </Button>
        </div>
      </fieldset>
    </form>
  )
}
