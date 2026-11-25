// File này làm gì: Mở màn hình tạo hoặc sửa lô và nhật ký của xưởng.
// Ai gọi file này: Router nghệ nhân tại /nghe-nhan/lo-san-xuat.
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '../api/client.js'
import { useResource } from '../api/useResource.js'
import { Button, Dialog, Resource } from '../components/UI.jsx'
import { BatchForm } from './BatchForm.jsx'
import { BatchJournal } from './BatchJournal.jsx'
import { batchPath } from './BatchList.jsx'

// Điều phối lưu thông tin lô, nhật ký và các thao tác theo mã lô.
function BatchWorkspace({ initial }) {
  const [batch, setBatch] = useState(initial)
  const [failure, setFailure] = useState(null)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const navigate = useNavigate()
  const endpoint = '/me/batches' + (batch ? '/' + batch.id : '')
  const errors = Object.fromEntries(
    (failure?.details ?? []).map(({ field, message }) => [field.split('.')[0], message]),
  )

  // Giữ thao tác ghi tách biệt để số lượng không bị mất khi server trả lỗi.
  async function run(action) {
    if (busy) return
    setBusy(true)
    setFailure(null)
    setNotice('')
    try {
      await action()
    } catch (error) {
      setFailure(error)
    } finally {
      setBusy(false)
    }
  }

  // Sau khi tạo, dùng ID server cấp để mở form gắn nhật ký.
  function save(body) {
    run(async () => {
      const { data } = await apiFetch(endpoint, { method: batch ? 'PATCH' : 'POST', body })
      if (!batch) navigate(batchPath + '/' + data.id, { replace: true })
      else {
        setBatch(data)
        setNotice('Đã lưu lô sản xuất.')
      }
    })
  }

  // Chỉ về danh sách sau khi server xóa lô thành công.
  function remove() {
    setDeleting(false)
    run(async () => {
      await apiFetch(endpoint, { method: 'DELETE' })
      navigate(batchPath)
    })
  }

  return (
    <div className="container narrow section stack">
      <p>
        <Link to={batchPath}>Về danh sách lô</Link>
      </p>
      <h1>{batch ? batch.name : 'Tạo lô sản xuất'}</h1>
      {batch && (
        <p>
          Mã lô <strong>{batch.batchCode}</strong>
        </p>
      )}
      {failure && (
        <p className="error" role="alert">
          {failure.message}
        </p>
      )}
      <BatchForm batch={batch} busy={busy} errors={errors} submit={save} />
      <p role="status">{notice}</p>
      {batch && (
        <>
          <div className="actions">
            <Button to={batchPath + '/' + batch.id + '/qr'}>Tải hoặc in QR</Button>
            {batch.isPublic && (
              <Button variant="secondary" to={'/truy-xuat/' + batch.batchCode}>
                Xem truy xuất
              </Button>
            )}
            {batch.status === 'PLANNED' && !batch.isPublic && (
              <Button variant="secondary" disabled={busy} onClick={() => setDeleting(true)}>
                Xóa lô
              </Button>
            )}
          </div>
          <BatchJournal batchId={batch.id} initial={batch.milestones} />
        </>
      )}
      {deleting && (
        <Dialog title="Xác nhận xóa lô" close={() => setDeleting(false)}>
          <p>Nhật ký và ảnh của lô này cũng sẽ bị xóa.</p>
          <Button disabled={busy} onClick={remove}>
            Xác nhận xóa
          </Button>
        </Dialog>
      )}
    </div>
  )
}

// Chờ lô riêng với đúng quyền trước khi hiển thị nội dung.
function ExistingBatch({ id }) {
  const state = useResource('/me/batches/' + encodeURIComponent(id))
  return <Resource state={state}>{(data) => <BatchWorkspace key={id} initial={data} />}</Resource>
}

// Chọn màn tạo mới hoặc mở lô theo tham số của route.
export function BatchEditor() {
  const { id } = useParams()
  if (id) return <ExistingBatch id={id} />
  return <BatchWorkspace key="create" initial={null} />
}
