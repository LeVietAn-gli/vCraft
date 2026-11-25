// File này làm gì: Chọn sản phẩm của xưởng và nhập số lượng cho từng sản phẩm.
// Ai gọi file này: BatchForm khi tạo hoặc sửa lô.
import { useState } from 'react'
import { useResource } from '../api/useResource.js'
import { Button, Field, Resource } from '../components/UI.jsx'

// Nút chọn của từng trang dùng dữ liệu thật và bỏ qua sản phẩm đã chọn.
function ProductChoices({ rows, add }) {
  const [page, setPage] = useState(1)
  const state = useResource('/me/products?limit=20&page=' + page)
  return (
    <Resource state={state}>
      {(products) => (
        <div className="stack">
          {products.length ? (
            <ul>
              {products.map((product) => (
                <li key={product.id} className="actions">
                  <span>{product.name}</span>
                  <Button
                    variant="secondary"
                    disabled={rows.some(({ productId }) => productId === product.id)}
                    aria-label={'Thêm ' + product.name}
                    onClick={() => add(product)}
                  >
                    Thêm
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p>Xưởng chưa có sản phẩm ở trang này.</p>
          )}
          <div className="actions">
            {page > 1 && (
              <Button variant="secondary" onClick={() => setPage(page - 1)}>
                Trang trước
              </Button>
            )}
            {page < state.meta.totalPages && (
              <Button variant="secondary" onClick={() => setPage(page + 1)}>
                Trang tiếp
              </Button>
            )}
          </div>
        </div>
      )}
    </Resource>
  )
}

// Số lượng được nhập theo từng dòng, ID lấy từ sản phẩm đã chọn.
export function BatchProducts({ rows, setRows }) {
  // Hiện ngay dòng mới để người dùng nhìn thấy số lượng mặc định.
  function add(product) {
    setRows((current) => [...current, { productId: product.id, name: product.name, quantity: '1' }])
  }

  // Chỉ cập nhật một dòng để giữ các số lượng khác.
  function changeQuantity(id, quantity) {
    setRows((current) => current.map((row) => (row.productId === id ? { ...row, quantity } : row)))
  }

  return (
    <section className="stack">
      <h3>Sản phẩm trong lô</h3>
      {!rows.length && <p>Chọn ít nhất một sản phẩm.</p>}
      {rows.map((row) => (
        <div key={row.productId} className="panel stack">
          <Field label={'Số lượng ' + row.name}>
            {(props) => (
              <input
                {...props}
                type="number"
                min="1"
                max="2147483647"
                step="1"
                required
                value={row.quantity}
                onChange={(event) => changeQuantity(row.productId, event.target.value)}
              />
            )}
          </Field>
          <div>
            <Button
              variant="secondary"
              onClick={() =>
                setRows((current) => current.filter((item) => item.productId !== row.productId))
              }
            >
              Bỏ {row.name}
            </Button>
          </div>
        </div>
      ))}
      <details>
        <summary>Chọn sản phẩm của xưởng</summary>
        <ProductChoices rows={rows} add={add} />
      </details>
    </section>
  )
}
