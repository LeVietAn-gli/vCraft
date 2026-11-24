import { MediaUpload } from '../components/MediaUpload.jsx'
import { useRef, useState } from 'react'
import { apiFetch } from '../api/client.js'
import { useResource } from '../api/useResource.js'
import { Button, Dialog, Field, Picture, Resource } from '../components/UI.jsx'
import styles from './WorkshopEditor.module.css'

const path = '/me/workshop'
export const week = Object.entries({
  mon: 'Thứ Hai',
  tue: 'Thứ Ba',
  wed: 'Thứ Tư',
  thu: 'Thứ Năm',
  fri: 'Thứ Sáu',
  sat: 'Thứ Bảy',
  sun: 'Chủ nhật',
})
const statusText = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt · đang hiển thị công khai',
  REJECTED: 'Đã từ chối',
}

function Profile({ workshop, categories, save, busy, validation }) {
  const [hours, setHours] = useState(workshop.openingHours)
  const form = useRef(null)
  const errors = Object.fromEntries(
    (validation?.details ?? []).map(({ field, message }) => [field, message]),
  )
  function changeDay(day, update) {
    setHours((old) => ({ ...old, [day]: update(old[day] ?? []) }))
  }
  function submit(event) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const number = (name) => (values.get(name) === '' ? null : Number(values.get(name)))
    save(
      {
        name: values.get('name'),
        address: values.get('address'),
        description: values.get('description'),
        history: values.get('history'),
        latitude: number('latitude'),
        longitude: number('longitude'),
        isOpenForVisit: values.has('isOpenForVisit'),
        acceptsOrders: values.has('acceptsOrders'),
        categoryIds: values.getAll('categoryIds'),
        openingHours: hours,
      },
      () =>
        requestAnimationFrame(() => form.current?.querySelector('[aria-invalid="true"]')?.focus()),
    )
  }
  return (
    <form ref={form} className="panel stack" onSubmit={submit}>
      <h2>Thông tin xưởng</h2>
      <fieldset className={styles.fields} disabled={busy}>
        <legend className={styles.visuallyHidden}>Nội dung hồ sơ</legend>
        {[
          ['name', 'Tên xưởng', true, 255],
          ['address', 'Địa chỉ', true, 300],
          ['description', 'Giới thiệu xưởng', false, 2000],
          ['history', 'Lịch sử gia đình', false, 10000],
        ].map(([name, label, required, maxLength]) => (
          <Field key={name} label={label} error={errors[name]}>
            {(props) =>
              name === 'name' || name === 'address' ? (
                <input
                  {...props}
                  name={name}
                  required={required}
                  maxLength={maxLength}
                  defaultValue={workshop[name]}
                />
              ) : (
                <textarea
                  {...props}
                  name={name}
                  rows="4"
                  maxLength={maxLength}
                  defaultValue={workshop[name]}
                />
              )
            }
          </Field>
        ))}
        <div className={styles.pair}>
          {[
            ['latitude', 'Vĩ độ', 85],
            ['longitude', 'Kinh độ', 180],
          ].map(([name, label, max]) => (
            <Field key={name} label={label} error={errors[name]}>
              {(props) => (
                <input
                  {...props}
                  name={name}
                  type="number"
                  step="any"
                  min={-max}
                  max={max}
                  defaultValue={workshop[name] ?? ''}
                />
              )}
            </Field>
          ))}
        </div>
        <fieldset className={styles.group}>
          <legend>Danh mục xưởng thực hiện</legend>
          {categories.map((category) => (
            <label className={styles.checkbox} key={category.id}>
              <input
                type="checkbox"
                name="categoryIds"
                value={category.id}
                defaultChecked={workshop.categoryIds.includes(category.id)}
              />
              {category.name}
            </label>
          ))}
          {!categories.length && <p>Chưa có danh mục.</p>}
        </fieldset>
        <label className={styles.checkbox}>
          <input type="checkbox" name="acceptsOrders" defaultChecked={workshop.acceptsOrders} />{' '}
          Nhận yêu cầu đặt hàng
        </label>
        <label className={styles.checkbox}>
          <input type="checkbox" name="isOpenForVisit" defaultChecked={workshop.isOpenForVisit} />{' '}
          Đón khách tham quan
        </label>
        <fieldset
          className={styles.group}
          aria-invalid={Boolean(errors.openingHours)}
          tabIndex={-1}
          aria-describedby={errors.openingHours ? 'hours-error' : undefined}
        >
          <legend>Giờ tham quan theo giờ Việt Nam</legend>
          {errors.openingHours && (
            <p id="hours-error" className="error" role="alert">
              {errors.openingHours}
            </p>
          )}
          {week.map(([day, label]) => {
            const slots = hours[day] ?? []
            const error = errors['openingHours.' + day]
            return (
              <div
                key={day}
                className={styles.day}
                role="group"
                aria-label={label}
                tabIndex={-1}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? day + '-error' : undefined}
              >
                <strong aria-hidden="true">{label}</strong>
                {error && (
                  <p id={day + '-error'} className="error" role="alert">
                    {error}
                  </p>
                )}
                {slots.map((slot, index) => (
                  <div key={index} className={styles.slot}>
                    {['Bắt đầu', 'Kết thúc'].map((title, position) => (
                      <Field
                        key={title}
                        label={title}
                        error={errors['openingHours.' + day + '.' + index + '.' + position]}
                      >
                        {(props) => (
                          <input
                            {...props}
                            type="time"
                            required
                            value={slot[position]}
                            onChange={(event) => {
                              const value = event.target.value
                              changeDay(day, (current) =>
                                current.map((row, rowIndex) =>
                                  rowIndex === index
                                    ? row.map((old, cell) => (cell === position ? value : old))
                                    : row,
                                ),
                              )
                            }}
                          />
                        )}
                      </Field>
                    ))}
                    <Button
                      variant="secondary"
                      aria-label={`Bỏ khung giờ ${index + 1} của ${label}`}
                      onClick={() =>
                        changeDay(day, (current) => current.filter((_, i) => i !== index))
                      }
                    >
                      Bỏ
                    </Button>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  disabled={slots.length >= 4}
                  onClick={() => changeDay(day, (current) => [...current, ['08:00', '12:00']])}
                >
                  Thêm khung giờ
                </Button>
              </div>
            )
          })}
        </fieldset>
        <div>
          <Button type="submit" disabled={busy}>
            {busy ? 'Đang lưu…' : 'Lưu hồ sơ'}
          </Button>
        </div>
      </fieldset>
    </form>
  )
}

function Editor({ initial, categories }) {
  const [workshop, setWorkshop] = useState(initial)
  const [active, setActive] = useState(null)
  const [notice, setNotice] = useState('')
  const [profileError, setProfileError] = useState(null)
  const [mediaErrors, setMediaErrors] = useState({})
  const [deleting, setDeleting] = useState(null)
  const running = useRef(false)
  const locked = workshop.status === 'REJECTED'
  async function operate(kind, request, done, failure) {
    if (running.current) return
    running.current = true
    setActive(kind)
    setNotice('')
    const setError =
      kind === 'profile'
        ? setProfileError
        : (error) => setMediaErrors((previous) => ({ ...previous, [kind]: error }))
    setError(null)
    try {
      await done(await request())
    } catch (error) {
      setError(error)
      failure?.()
    } finally {
      running.current = false
      setActive(null)
    }
  }
  function upload(certificate, body, done) {
    const key = certificate ? 'certificates' : 'images'
    operate(
      key,
      () => apiFetch(path + '/' + key, { method: 'POST', body }),
      ({ data }) => {
        setWorkshop((row) => ({
          ...row,
          [key]: certificate ? [data, ...row[key]] : [...row[key], ...data],
        }))
        done()
      },
    )
  }
  function move(index, direction) {
    const ids = workshop.images.map(({ id }) => id)
    const next = index + direction
    ;[ids[index], ids[next]] = [ids[next], ids[index]]
    operate(
      'images',
      () => apiFetch(path + '/images/order', { method: 'PATCH', body: { ids } }),
      ({ data }) => {
        setWorkshop((row) => ({ ...row, images: data }))
        setNotice('Đã lưu thứ tự ảnh.')
      },
    )
  }
  function remove() {
    const { key, id } = deleting
    setDeleting(null)
    operate(
      key,
      () => apiFetch(path + '/' + key + '/' + id, { method: 'DELETE' }),
      () => {
        setWorkshop((row) => ({ ...row, [key]: row[key].filter((entry) => entry.id !== id) }))
        setNotice('Đã xóa ảnh.')
      },
    )
  }
  return (
    <>
      <h1>Hồ sơ xưởng của tôi</h1>
      <p>
        <strong>{statusText[workshop.status]}</strong>
      </p>
      {workshop.status === 'PENDING' && (
        <p>Bạn có thể bổ sung hồ sơ. Khách chỉ xem được sau khi Ban quản lý duyệt.</p>
      )}
      {locked && <p>{workshop.rejectionReason}</p>}
      {workshop.status === 'APPROVED' && (
        <p>
          <Button to={'/xuong/' + workshop.slug} variant="secondary">
            Xem hồ sơ công khai
          </Button>
        </p>
      )}
      <div className="stack">
        <Profile
          workshop={workshop}
          categories={categories}
          busy={Boolean(active) || locked}
          validation={profileError}
          save={(body, focus) =>
            operate(
              'profile',
              () => apiFetch(path, { method: 'PATCH', body }),
              ({ data }) => {
                setWorkshop(data)
                setNotice('Đã lưu hồ sơ xưởng.')
              },
              focus,
            )
          }
        />
        {profileError && (
          <p className="error" role="alert">
            {profileError.message}
          </p>
        )}
        <section className="panel stack">
          <h2>Ảnh xưởng</h2>
          {mediaErrors.images && (
            <p className="error" role="alert">
              {mediaErrors.images.message}
            </p>
          )}
          {!locked && (
            <MediaUpload
              busy={Boolean(active)}
              maximumMb={workshop.maxUploadMb}
              run={(body, done) => upload(false, body, done)}
            />
          )}
          {workshop.images.length === 0 && <p>Chưa có ảnh xưởng.</p>}
          <div className={styles.album}>
            {workshop.images.map((entry, index) => (
              <article key={entry.id}>
                <Picture
                  src={entry.thumbUrl}
                  alt={entry.altText}
                  width="400"
                  height="300"
                  loading="lazy"
                />
                <p>{entry.altText}</p>
                {!locked && (
                  <div className="actions">
                    <Button
                      variant="secondary"
                      disabled={Boolean(active) || index === 0}
                      aria-label={'Đưa lên ảnh ' + (index + 1)}
                      onClick={() => move(index, -1)}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={Boolean(active) || index === workshop.images.length - 1}
                      aria-label={'Đưa xuống ảnh ' + (index + 1)}
                      onClick={() => move(index, 1)}
                    >
                      ↓
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={Boolean(active)}
                      aria-label={'Xóa ảnh ' + (index + 1)}
                      onClick={() => setDeleting({ key: 'images', id: entry.id })}
                    >
                      Xóa
                    </Button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
        <section className="panel stack">
          <h2>Chứng nhận chất lượng</h2>
          {mediaErrors.certificates && (
            <p className="error" role="alert">
              {mediaErrors.certificates.message}
            </p>
          )}
          {!locked && (
            <MediaUpload
              certificate
              busy={Boolean(active)}
              maximumMb={workshop.maxUploadMb}
              run={(body, done) => upload(true, body, done)}
            />
          )}
          {workshop.certificates.length === 0 && <p>Chưa có chứng nhận.</p>}
          {workshop.certificates.map((entry) => (
            <div className="actions" key={entry.id}>
              <a href={entry.fileUrl}>
                {entry.title} · {entry.issuer}
              </a>
              {!locked && (
                <Button
                  variant="secondary"
                  disabled={Boolean(active)}
                  onClick={() => setDeleting({ key: 'certificates', id: entry.id })}
                >
                  Xóa chứng nhận
                </Button>
              )}
            </div>
          ))}
        </section>
        <p role="status">{notice}</p>
      </div>
      {deleting && (
        <Dialog title="Xác nhận xóa ảnh" close={() => setDeleting(null)}>
          <p>Ảnh sẽ được gỡ khỏi hồ sơ của xưởng.</p>
          <div className="actions">
            <Button onClick={remove}>Xóa ảnh</Button>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Hủy
            </Button>
          </div>
        </Dialog>
      )}
    </>
  )
}

export default function WorkshopEditor() {
  const profile = useResource(path)
  const categories = useResource('/categories')
  return (
    <div className="container narrow section">
      <Resource state={profile}>
        {(initial) => (
          <Resource state={categories}>
            {(data) => <Editor key={initial.id} initial={initial} categories={data} />}
          </Resource>
        )}
      </Resource>
    </div>
  )
}
