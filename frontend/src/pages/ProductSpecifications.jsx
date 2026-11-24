// File này làm gì: Hiển thị các cặp tên và giá trị thông số.
// Ai gọi file này: ProductForm khi tạo hoặc sửa sản phẩm.
import { Button, Field } from '../components/UI.jsx'
import styles from './Products.module.css'

// Mỗi dòng có ID riêng để xóa một dòng không làm đổi dữ liệu của dòng khác.
export function ProductSpecifications({ rows, rowError, error, addRow, removeRow, setRow }) {
  return (
    <fieldset className="stack">
      <legend>Thông số</legend>
      {rowError && (
        <p className="error" role="alert">
          {rowError}
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {rows.map(({ id, key, val }, i) => (
        <div className={styles.pair} key={id}>
          <Field label={'Tên thông số ' + (i + 1)}>
            {(props) => (
              <input
                {...props}
                value={key}
                required
                maxLength="100"
                onChange={(e) => setRow(id, 'key', e.target.value)}
              />
            )}
          </Field>
          <Field label={'Giá trị ' + (i + 1)}>
            {(props) => (
              <input
                {...props}
                value={val}
                maxLength="1000"
                onChange={(e) => setRow(id, 'val', e.target.value)}
              />
            )}
          </Field>
          <div>
            <Button variant="secondary" onClick={() => removeRow(id)}>
              Bỏ thông số {i + 1}
            </Button>
          </div>
        </div>
      ))}
      <div>
        <Button variant="secondary" disabled={rows.length >= 30} onClick={addRow}>
          Thêm thông số
        </Button>
      </div>
    </fieldset>
  )
}
