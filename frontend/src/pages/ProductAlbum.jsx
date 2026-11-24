// File này làm gì: Quản lý ảnh, thứ tự và ảnh đại diện của sản phẩm.
// Ai gọi file này: ProductEditor sau khi sản phẩm đã được lưu.
import { useState } from 'react'
import { apiFetch } from '../api/client.js'
import { MediaUpload } from '../components/MediaUpload.jsx'
import { Button, Dialog, Picture } from '../components/UI.jsx'
import styles from './Products.module.css'

// Hiển thị một ảnh và chỉ bật các thao tác hợp lệ tại vị trí hiện tại.
function ProductPhoto({ image, index, name, busy, setPrimary, moveUp, confirmDelete }) {
  return (
    <article className="stack">
      <Picture
        src={image.thumbUrl}
        alt={image.altText || name}
        width="400"
        height="300"
        loading="lazy"
      />
      {image.isPrimary ? (
        <strong>Ảnh đại diện</strong>
      ) : (
        <div>
          <Button variant="secondary" disabled={busy} onClick={setPrimary}>
            Đặt làm đại diện
          </Button>
        </div>
      )}
      <div className="actions">
        <Button
          variant="secondary"
          disabled={busy || index === 0}
          aria-label={'Đưa lên ảnh ' + (index + 1)}
          onClick={moveUp}
        >
          ↑
        </Button>
        <Button
          variant="secondary"
          disabled={busy}
          aria-label={'Xóa ảnh ' + (index + 1)}
          onClick={confirmDelete}
        >
          Xóa ảnh
        </Button>
      </div>
    </article>
  )
}

// Dùng cùng cờ chờ với form sản phẩm để hai thao tác ghi không chạy đồng thời.
export function ProductAlbum({ product, path, busy, error, maximumMb, run, updateImages }) {
  const [deleting, setDeleting] = useState(null)

  // Thêm ảnh đã được server xử lý và chỉ xóa tệp đang chọn khi tải thành công.
  function upload(body, done) {
    run('album', async () => {
      const { data } = await apiFetch(path + '/images', { method: 'POST', body })
      updateImages([...product.images, ...data])
      done()
    })
  }

  // Dùng danh sách trả về từ server để hiển thị cờ đại diện mới.
  function setPrimary(id) {
    run('album', async () => {
      const { data } = await apiFetch(path + '/images/' + id + '/primary', { method: 'PATCH' })
      updateImages(data)
    })
  }

  // Đổi hai vị trí liền nhau rồi gửi toàn bộ thứ tự cho server kiểm tra.
  function moveUp(index) {
    if (index === 0) return
    const ids = product.images.map((image) => image.id)
    const previousId = ids[index - 1]
    ids[index - 1] = ids[index]
    ids[index] = previousId
    run('album', async () => {
      const { data } = await apiFetch(path + '/images/order', { method: 'PATCH', body: { ids } })
      updateImages(data)
    })
  }

  // Đọc lại album sau khi xóa vì server có thể chọn ảnh đại diện thay thế.
  function remove() {
    const id = deleting
    setDeleting(null)
    run('album', async () => {
      await apiFetch(path + '/images/' + id, { method: 'DELETE' })
      updateImages(product.images.filter((image) => image.id !== id))
      const { data } = await apiFetch(path)
      updateImages(data.images)
    })
  }

  return (
    <section className="panel stack">
      <h2>Ảnh sản phẩm</h2>
      {error && (
        <p className="error" role="alert">
          {error.message}
        </p>
      )}
      <MediaUpload busy={busy} maximumMb={maximumMb} label="Chọn ảnh sản phẩm" run={upload} />
      {!product.images.length && <p>Chưa có ảnh. Tải ít nhất một ảnh để công khai sản phẩm.</p>}
      <div className={styles.album}>
        {product.images.map((image, index) => (
          <ProductPhoto
            key={image.id}
            image={image}
            index={index}
            name={product.name}
            busy={busy}
            setPrimary={() => setPrimary(image.id)}
            moveUp={() => moveUp(index)}
            confirmDelete={() => setDeleting(image.id)}
          />
        ))}
      </div>
      {deleting && (
        <Dialog title="Xác nhận xóa ảnh" close={() => setDeleting(null)}>
          <p>Ảnh sẽ được gỡ khỏi sản phẩm.</p>
          <Button disabled={busy} onClick={remove}>
            Xác nhận xóa
          </Button>
        </Dialog>
      )}
    </section>
  )
}
