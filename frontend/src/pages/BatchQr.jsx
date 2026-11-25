// File này làm gì: Xem, tải PNG/SVG và in một nhãn QR của lô.
// Ai gọi file này: Route QR trong khu vực nghệ nhân.
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useResource } from '../api/useResource.js'
import { Button, Resource } from '../components/UI.jsx'
import { batchPath } from './BatchList.jsx'
import styles from './BatchQr.module.css'

// Chỉ cho in khi ảnh đã tải, để tránh in ra nhãn trắng lúc mạng chậm.
function Label({ batch }) {
  const [imageState, setImageState] = useState('loading')
  const [attempt, setAttempt] = useState(0)
  const url = '/api/me/batches/' + encodeURIComponent(batch.id) + '/qr'
  return (
    <div className={styles.printPage + ' stack'}>
      <div className={styles.label}>
        <h1>{batch.name}</h1>
        <p>
          Mã lô <strong>{batch.batchCode}</strong>
        </p>
        {imageState !== 'error' && (
          <img
            key={attempt}
            className={styles.code}
            src={url + '?format=png&size=512&_retry=' + attempt}
            width="320"
            height="320"
            alt={'QR truy xuất lô ' + batch.batchCode}
            onLoad={() => setImageState('ready')}
            onError={() => setImageState('error')}
          />
        )}
        <p>Quét để xem nhật ký sản xuất của lô.</p>
      </div>
      <div className={styles.noPrint + ' stack'}>
        {!batch.isPublic && <p>Lô đang riêng tư. Công khai lô để khách mở được trang truy xuất.</p>}
        {imageState === 'loading' && <p role="status">Đang tải QR…</p>}
        {imageState === 'error' && (
          <div className="actions">
            <p className="error" role="alert">
              Không tải được QR.
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setImageState('loading')
                setAttempt((value) => value + 1)
              }}
            >
              Thử lại
            </Button>
          </div>
        )}
        <div className="actions">
          <a href={url + '?format=png&download=1'}>Tải PNG</a>
          <a href={url + '?format=svg&download=1'}>Tải SVG</a>
          <Button disabled={imageState !== 'ready'} onClick={() => window.print()}>
            In nhãn QR
          </Button>
          <Button variant="secondary" to={batchPath + '/' + batch.id}>
            Về quản lý lô
          </Button>
        </div>
      </div>
    </div>
  )
}

// Dùng API lô riêng để kiểm quyền trước khi hiển thị nhãn.
export function BatchQr() {
  const { id } = useParams()
  const state = useResource('/me/batches/' + encodeURIComponent(id))
  return (
    <div className="container narrow section">
      <Resource state={state}>{(batch) => <Label key={id} batch={batch} />}</Resource>
    </div>
  )
}
