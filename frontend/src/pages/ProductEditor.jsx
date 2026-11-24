// File này làm gì: Tải dữ liệu, lưu hoặc xóa sản phẩm và điều phối form với album.
// Ai gọi file này: Các route tạo và sửa sản phẩm trong main.jsx.
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '../api/client.js'
import { useResource } from '../api/useResource.js'
import { Button, Dialog, Resource } from '../components/UI.jsx'
import { ProductAlbum } from './ProductAlbum.jsx'
import { ProductForm } from './ProductForm.jsx'

const endpoint = '/me/products'
const editorPath = '/nghe-nhan/san-pham'

// Quản lý trạng thái chung của sản phẩm và thông báo lỗi theo vùng thao tác.
function ProductWorkspace({ initial, workshop }) {
  const [product, setProduct] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState(null)
  const [notice, setNotice] = useState('')
  const [confirm, setConfirm] = useState(false)
  const navigate = useNavigate()
  const path = initial ? endpoint + '/' + initial.id : endpoint
  const fieldErrors = Object.fromEntries(
    (failure?.error.details ?? []).map(({ field, message }) => [field.split('.')[0], message]),
  )

  // Khóa các nút ghi trong thời gian chờ và để lỗi xuất hiện đúng vùng.
  async function run(section, action) {
    if (busy) return
    setBusy(true)
    setFailure(null)
    setNotice('')
    try {
      await action()
    } catch (error) {
      setFailure({ section, error })
    } finally {
      setBusy(false)
    }
  }

  // Tạo xong thì mở trang sửa bằng ID do server cấp để có thể tải ảnh.
  function save(body) {
    run('form', async () => {
      const { data } = await apiFetch(path, { method: initial ? 'PATCH' : 'POST', body })
      if (initial) {
        setProduct(data)
        setNotice('Đã lưu sản phẩm.')
      } else {
        navigate(editorPath + '/' + data.id, { replace: true })
      }
    })
  }

  // Chỉ quay về danh sách nếu API xác nhận đã xóa.
  function remove() {
    setConfirm(false)
    run('form', async () => {
      await apiFetch(path, { method: 'DELETE' })
      navigate(editorPath)
    })
  }

  return (
    <div className="container narrow section stack">
      <p>
        <Link to={editorPath}>Về sản phẩm của xưởng</Link>
      </p>
      <h1>{product ? product.name : 'Thêm sản phẩm'}</h1>
      {workshop.status !== 'APPROVED' ? (
        <p role="alert">Xưởng cần được duyệt để quản lý sản phẩm.</p>
      ) : (
        <>
          {failure?.section === 'form' && (
            <p className="error" role="alert">
              {failure.error.message}
            </p>
          )}
          <ProductForm
            value={product}
            categories={workshop.categories.map(({ category }) => category)}
            busy={busy}
            errors={failure?.section === 'form' ? fieldErrors : {}}
            submit={save}
          />
          {product && (
            <>
              {product.status === 'VISIBLE' && (
                <div>
                  <Button to={'/san-pham/' + product.slug} variant="secondary">
                    Xem trang công khai
                  </Button>
                </div>
              )}
              <ProductAlbum
                product={product}
                path={path}
                busy={busy}
                maximumMb={workshop.maxUploadMb}
                error={failure?.section === 'album' ? failure.error : null}
                run={run}
                updateImages={(images) => setProduct((current) => ({ ...current, images }))}
              />
              <div>
                <Button variant="secondary" disabled={busy} onClick={() => setConfirm(true)}>
                  Xóa sản phẩm
                </Button>
              </div>
            </>
          )}
          <p role="status">{notice}</p>
        </>
      )}
      {confirm && (
        <Dialog title="Xác nhận xóa sản phẩm" close={() => setConfirm(false)}>
          <p>Sản phẩm đã thuộc lô có thể chuyển sang Ẩn để giữ truy xuất.</p>
          <Button disabled={busy} onClick={remove}>
            Xác nhận xóa
          </Button>
        </Dialog>
      )}
    </div>
  )
}

// Tải sản phẩm theo ID khi mở trực tiếp trang sửa.
function ExistingProduct({ id, workshop }) {
  const state = useResource(endpoint + '/' + encodeURIComponent(id))
  return (
    <Resource state={state}>
      {(value) => <ProductWorkspace key={id} initial={value} workshop={workshop} />}
    </Resource>
  )
}

// Đọc hồ sơ xưởng để lấy trạng thái duyệt, danh mục và giới hạn tải ảnh.
export function ProductEditor() {
  const { id } = useParams()
  const workshop = useResource('/me/workshop')
  return (
    <Resource state={workshop}>
      {(value) =>
        id ? (
          <ExistingProduct id={id} workshop={value} />
        ) : (
          <ProductWorkspace key="create" initial={null} workshop={value} />
        )
      }
    </Resource>
  )
}
