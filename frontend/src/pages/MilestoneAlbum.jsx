import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../api/client.js'
import { useResource } from '../api/useResource.js'
import { MediaUpload } from '../components/MediaUpload.jsx'
import { Button, Dialog, Picture, Resource } from '../components/UI.jsx'
import styles from './Products.module.css'

const base = '/nghe-nhan/anh-nhat-ky'

export function MilestoneIndex() {
  const state = useResource('/me/milestones')
  return (
    <div className="container narrow section stack">
      <h1>Ảnh nhật ký sản xuất</h1>
      <Resource state={state}>
        {(items) =>
          items.length ? (
            <ul>
              {items.map(({ id, title, batch }) => (
                <li key={id}>
                  <Link to={base + '/' + id}>
                    {batch.name} · {title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>Xưởng chưa có mốc sản xuất.</p>
          )
        }
      </Resource>
    </div>
  )
}

function Album({ initial, path }) {
  const [photos, setPhotos] = useState(initial.images)
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState(null)
  async function run(action) {
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
  return (
    <>
      <h1>{initial.title}</h1>
      <section className="panel stack">
        <h2>Ảnh minh chứng</h2>
        {failure && (
          <p role="alert" className="error">
            {failure}
          </p>
        )}
        <MediaUpload
          busy={busy}
          label="Chọn ảnh mốc"
          maximumMb={initial.maxUploadMb}
          run={(body, done) =>
            run(async () => {
              const { data } = await apiFetch(path, { method: 'POST', body })
              setPhotos((current) => [...current, ...data])
              done()
            })
          }
        />
        {!photos.length && <p>Mốc chưa có ảnh.</p>}
        <div className={styles.album}>
          {photos.map((photo, i) => (
            <div className="stack" key={photo.id}>
              <Picture
                src={photo.thumbUrl}
                alt={photo.altText || initial.title}
                loading="lazy"
                width="400"
                height="300"
              />
              <div>
                <Button
                  variant="secondary"
                  aria-label={'Xóa ảnh mốc ' + (i + 1)}
                  disabled={busy}
                  onClick={() => setDeleting(photo.id)}
                >
                  Xóa ảnh
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
      {deleting && (
        <Dialog title="Xác nhận xóa ảnh mốc" close={() => setDeleting(null)}>
          <Button
            onClick={() => {
              const id = deleting
              setDeleting(null)
              run(async () => {
                await apiFetch(path + '/' + id, { method: 'DELETE' })
                setPhotos((items) => items.filter((photo) => photo.id !== id))
              })
            }}
          >
            Xác nhận xóa
          </Button>
        </Dialog>
      )}
    </>
  )
}

export function MilestoneAlbum() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const batchId = params.get('batchId')
  const back = batchId ? '/nghe-nhan/lo-san-xuat/' + encodeURIComponent(batchId) : base
  const path = '/me/milestones/' + encodeURIComponent(id) + '/images'
  const state = useResource(path)
  return (
    <div className="container narrow section stack">
      <p>
        <Link to={back}>{batchId ? 'Về quản lý lô' : 'Về danh sách mốc'}</Link>
      </p>
      <Resource state={state}>
        {(initial) => <Album key={id} initial={initial} path={path} />}
      </Resource>
    </div>
  )
}
