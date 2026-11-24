// File này làm gì: Liệt kê sản phẩm của xưởng theo trạng thái và trang.
// Ai gọi file này: Route /nghe-nhan/san-pham trong main.jsx.
import { useSearchParams } from 'react-router-dom'
import { useResource } from '../api/useResource.js'
import { Pagination } from '../components/Pagination.jsx'
import { Button, Picture, Resource } from '../components/UI.jsx'
import { productStatusLabels } from './ProductForm.jsx'
import styles from './Products.module.css'

const endpoint = '/me/products'
const editorPath = '/nghe-nhan/san-pham'

// Giữ trạng thái lọc trên URL để người dùng có thể tải lại hoặc chuyển trang.
export function ProductManager() {
  const [params] = useSearchParams()
  const state = useResource(endpoint + '?' + params)
  const filter = params.get('status') || ''
  return (
    <div className="container section stack">
      <header>
        <h1>Sản phẩm của xưởng</h1>
        <div className="actions">
          <Button to={editorPath + '/tao'}>Thêm sản phẩm</Button>
          <Button to="/nghe-nhan/anh-nhat-ky" variant="secondary">
            Ảnh nhật ký
          </Button>
        </div>
      </header>
      <nav className="actions" aria-label="Lọc sản phẩm của xưởng">
        {[['', 'Tất cả'], ...Object.entries(productStatusLabels)].map(([value, label]) => (
          <Button
            key={value}
            to={editorPath + (value ? '?status=' + value : '')}
            aria-current={value === filter ? 'page' : undefined}
            variant={value === filter ? 'primary' : 'secondary'}
          >
            {label}
          </Button>
        ))}
      </nav>
      <Resource state={state}>
        {(items) => (
          <>
            {!items.length && <p>Chưa có sản phẩm trong nhóm này.</p>}
            <ul className={styles.rows}>
              {items.map((item) => (
                <li className={'panel ' + styles.row} key={item.id}>
                  <Picture
                    src={item.images[0]?.thumbUrl}
                    alt={item.images[0]?.altText || item.name}
                    loading="lazy"
                    width="80"
                    height="80"
                  />
                  <div>
                    <h2>{item.name}</h2>
                    <p>
                      {productStatusLabels[item.status]} ·{' '}
                      {item.price === null ? 'Liên hệ báo giá' : item.price + ' VND'}
                    </p>
                  </div>
                  <Button
                    to={editorPath + '/' + item.id}
                    variant="secondary"
                    aria-label={'Sửa ' + item.name}
                  >
                    Sửa sản phẩm
                  </Button>
                </li>
              ))}
            </ul>
            <Pagination
              meta={state.meta}
              toPage={(page) => {
                const next = new URLSearchParams(params)
                next.set('page', page)
                return editorPath + '?' + next
              }}
            />
          </>
        )}
      </Resource>
    </div>
  )
}
