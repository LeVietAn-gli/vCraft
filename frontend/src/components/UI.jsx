import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './UI.module.css'

export function Button({ to, variant = 'primary', children, ...props }) {
  const className = [styles.button, styles[variant]].filter(Boolean).join(' ')
  return to ? (
    <Link to={to} className={className} {...props}>
      {children}
    </Link>
  ) : (
    <button type="button" className={className} {...props}>
      {children}
    </button>
  )
}

export function Field({ label, error, children }) {
  const id = useId()
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? id + '-error' : undefined,
      })}
      {error && (
        <p className="error" id={id + '-error'} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export function Resource({ state, children }) {
  if (state.error)
    return (
      <div className="panel" role="alert">
        <p className="error">{state.error.message}</p>
        {state.error.status === 401 ? (
          <Button to="/dang-nhap">Đăng nhập</Button>
        ) : (
          <Button variant="secondary" onClick={state.reload}>
            Thử lại
          </Button>
        )}
      </div>
    )
  if (state.data === undefined) return <p role="status">Đang tải nội dung…</p>
  return children(state.data)
}

export function Picture({ src, alt = '', ...props }) {
  const [failed, setFailed] = useState(null)
  return src && failed !== src ? (
    <img src={src} alt={alt} {...props} onError={() => setFailed(src)} />
  ) : (
    <div className={styles.placeholder}>
      <img src="/brand/logo.svg" alt="" width="116" height="32" />
      <span>{alt || 'Chưa có ảnh'}</span>
    </div>
  )
}

export function Dialog({ title, children, close }) {
  const ref = useRef(null)
  const heading = useId()
  useEffect(() => {
    const dialog = ref.current
    const trigger = document.activeElement
    dialog.showModal()
    return () => {
      dialog.close()
      trigger?.focus()
    }
  }, [])
  return (
    <dialog className={styles.dialog} ref={ref} aria-labelledby={heading} onCancel={close}>
      <div className="actions">
        <h2 id={heading}>{title}</h2>
        <Button variant="secondary" onClick={close}>
          Đóng
        </Button>
      </div>
      {children}
    </dialog>
  )
}

export function Gallery({ images }) {
  const [selected, setSelected] = useState(null)
  return (
    <>
      <div className={styles.gallery}>
        {images.map((image) => (
          <figure key={image.id}>
            <button
              className={styles.photoButton}
              type="button"
              aria-label={'Mở ảnh ' + (image.altText || 'xưởng gốm')}
              onClick={() => setSelected(image)}
            >
              <Picture
                src={image.thumbUrl}
                alt={image.altText}
                loading="lazy"
                width="400"
                height="300"
              />
            </button>
            {image.altText && <figcaption>{image.altText}</figcaption>}
          </figure>
        ))}
      </div>
      {selected && (
        <Dialog title={selected.altText || 'Ảnh triển lãm'} close={() => setSelected(null)}>
          <Picture src={selected.imageUrl} alt={selected.altText} />
        </Dialog>
      )}
    </>
  )
}

export function CardGrid({ entries, type }) {
  if (!entries.length) return <p className="muted">Chưa có nội dung công khai.</p>
  return (
    <div className={styles.grid}>
      {entries.map((entry) => (
        <article key={entry.slug} className={styles.card}>
          <Picture
            src={entry.thumbUrl ?? entry.images?.[0]?.thumbUrl}
            alt={entry.images?.[0]?.altText || entry.name}
            loading="lazy"
            width="400"
            height="500"
          />
          <h3>
            {type === 'workshop' ? (
              <Link to={'/xuong/' + entry.slug}>{entry.name}</Link>
            ) : type === 'product' ? (
              <Link to={'/san-pham/' + entry.slug}>{entry.name}</Link>
            ) : (
              entry.name
            )}
          </h3>
          {entry.address && <p className="muted">{entry.address}</p>}
          {entry.workshop && <p className="muted">{entry.workshop.name}</p>}
          {type === 'product' && (
            <p>
              {entry.price == null
                ? 'Liên hệ báo giá'
                : new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                    maximumFractionDigits: 2,
                  }).format(entry.price)}
            </p>
          )}
          {type === 'product' && (
            <Button
              to={'/san-pham/' + entry.slug}
              variant="secondary"
              aria-label={'Xem chi tiết ' + entry.name}
            >
              Xem chi tiết
            </Button>
          )}
        </article>
      ))}
    </div>
  )
}
