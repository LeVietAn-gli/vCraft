// File này làm gì: Thêm, sửa, xóa và đổi thứ tự mốc theo lô.
// Ai gọi file này: BatchEditor khi lô đã có ID.
import { useState } from 'react'
import { apiFetch } from '../api/client.js'
import { Button, Dialog } from '../components/UI.jsx'
import { ProductionTimeline } from '../components/ProductionTimeline.jsx'
import { MilestoneForm } from './MilestoneForm.jsx'

// Tách các nút của mốc khỏi form để tránh lồng form và dễ dùng trên mobile.
function MilestoneActions({ entry, index, busy, edit, moveUp, askDelete, batchId }) {
  return (
    <div className="panel stack">
      <h3>
        {index + 1}. {entry.title}
      </h3>
      <div className="actions">
        <Button variant="secondary" disabled={busy} onClick={edit}>
          Sửa mốc
        </Button>
        <Button variant="secondary" disabled={busy || index === 0} onClick={moveUp}>
          Đưa mốc lên
        </Button>
        <Button variant="secondary" disabled={busy} onClick={askDelete}>
          Xóa mốc
        </Button>
        <Button
          variant="secondary"
          to={'/nghe-nhan/anh-nhat-ky/' + entry.id + '?batchId=' + batchId}
        >
          Ảnh minh chứng
        </Button>
      </div>
    </div>
  )
}

// Dùng dữ liệu server để cập nhật danh sách và xem trước timeline sau mỗi thao tác.
export function BatchJournal({ batchId, initial }) {
  const [entries, setEntries] = useState(initial)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState('')
  const endpoint = '/me/batches/' + batchId + '/milestones'

  // Giữ form đang mở khi API lỗi để người dùng sửa dữ liệu rồi thử lại.
  async function run(action) {
    if (busy) return
    setBusy(true)
    setFailure('')
    try {
      await action()
    } catch (error) {
      setFailure(error.message)
    } finally {
      setBusy(false)
    }
  }

  // Mốc mới nối cuối, còn mốc sửa giữ vị trí hiện tại.
  function save(body) {
    run(async () => {
      const path = editing === 'new' ? endpoint : '/me/milestones/' + editing.id
      const { data } = await apiFetch(path, { method: editing === 'new' ? 'POST' : 'PATCH', body })
      if (editing === 'new') setEntries((rows) => [...rows, data])
      else setEntries((rows) => rows.map((row) => (row.id === data.id ? data : row)))
      setEditing(null)
    })
  }

  // Gửi toàn bộ thứ tự để server phát hiện khi danh sách đã đổi ở tab khác.
  function moveUp(index) {
    if (index === 0) return
    const ids = entries.map(({ id }) => id)
    const previous = ids[index - 1]
    ids[index - 1] = ids[index]
    ids[index] = previous
    run(async () => {
      const { data } = await apiFetch(endpoint + '/order', { method: 'PATCH', body: { ids } })
      setEntries(data)
    })
  }

  // Chờ server xóa mốc và ảnh liên quan trước khi bỏ dòng trên giao diện.
  function remove() {
    const id = deleting
    setDeleting(null)
    run(async () => {
      await apiFetch('/me/milestones/' + id, { method: 'DELETE' })
      setEntries((rows) => rows.filter((row) => row.id !== id))
      if (editing?.id === id) setEditing(null)
    })
  }

  return (
    <section className="stack">
      <h2>Nhật ký sản xuất</h2>
      <div>
        <Button disabled={busy} onClick={() => setEditing('new')}>
          Thêm mốc
        </Button>
      </div>
      {failure && (
        <p className="error" role="alert">
          {failure}
        </p>
      )}
      {editing && (
        <>
          <MilestoneForm
            key={editing.id ?? 'new'}
            entry={editing === 'new' ? null : editing}
            busy={busy}
            save={save}
          />
          <div>
            <Button variant="secondary" disabled={busy} onClick={() => setEditing(null)}>
              Hủy sửa mốc
            </Button>
          </div>
        </>
      )}
      {entries.map((entry, index) => (
        <MilestoneActions
          key={entry.id}
          entry={entry}
          index={index}
          busy={busy}
          batchId={batchId}
          edit={() => setEditing(entry)}
          moveUp={() => moveUp(index)}
          askDelete={() => setDeleting(entry.id)}
        />
      ))}
      <section>
        <h3>Xem trước timeline</h3>
        <ProductionTimeline milestones={entries} />
      </section>
      {deleting && (
        <Dialog title="Xác nhận xóa mốc" close={() => setDeleting(null)}>
          <p>Ảnh minh chứng gắn với mốc này cũng sẽ bị xóa.</p>
          <Button disabled={busy} onClick={remove}>
            Xác nhận xóa
          </Button>
        </Dialog>
      )}
    </section>
  )
}
