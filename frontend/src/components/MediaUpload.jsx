// File này làm gì: Chọn ảnh, xem trước và chuẩn bị dữ liệu multipart.
// Ai gọi file này: Form hồ sơ xưởng, sản phẩm và album mốc nhật ký.
import { useEffect, useState } from 'react'
import { Button, Field } from './UI.jsx'
import styles from './MediaUpload.module.css'

const imageTypes = ['image/jpeg', 'image/png', 'image/webp']

// Tìm tệp lỗi sớm để người dùng sửa trước khi gửi lên server.
function findInvalidFile(files, maximumMb) {
  return files.find((file) => {
    const hasInvalidType = file.type && !imageTypes.includes(file.type)
    const isTooLarge = maximumMb && file.size > maximumMb * 1024 * 1024
    return !file.size || hasInvalidType || isTooLarge
  })
}

// Hiển thị ô chọn và xem trước cho album xưởng, sản phẩm, mốc và chứng nhận.
export function MediaUpload({
  certificate = false,
  busy,
  run,
  maximumMb,
  label = 'Chọn ảnh xưởng',
}) {
  const [selected, setSelected] = useState([])
  const [fileError, setFileError] = useState('')
  const [message, setMessage] = useState('')
  // Thu hồi URL của lượt chọn trước khi đổi bộ ảnh hoặc rời trang.
  useEffect(() => {
    return () => {
      for (const item of selected) URL.revokeObjectURL(item.previewUrl)
    }
  }, [selected])

  // Mỗi lượt chọn có URL xem trước riêng, nên ô mô tả cũ được bỏ cùng ảnh cũ.
  function choose(input) {
    const files = Array.from(input.files)
    const invalid = findInvalidFile(files, maximumMb)
    setMessage('')
    if (files.length > 10 || invalid) {
      const message = invalid
        ? 'Kiểm tra tệp “' + invalid.name + '”. Chọn ảnh JPEG, PNG hoặc WebP đúng giới hạn.'
        : 'Chọn tối đa 10 ảnh mỗi lần.'
      setFileError(message)
      setSelected([])
      input.value = ''
      return
    }
    setFileError('')
    setSelected(files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })))
  }

  // Giữ tệp và mô tả nếu API báo lỗi, chỉ xóa form sau khi lưu thành công.
  function submit(event) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    for (const item of selected) data.append(certificate ? 'file' : 'images', item.file)
    run(data, () => {
      form.reset()
      setSelected([])
      setMessage(certificate ? 'Đã thêm chứng nhận.' : 'Đã tải ảnh lên.')
    })
  }
  return (
    <form className="stack" onSubmit={submit}>
      <fieldset disabled={busy} className={styles.fields}>
        <legend className={styles.visuallyHidden}>
          {certificate ? 'Thêm chứng nhận' : 'Tải ảnh'}
        </legend>
        {certificate && (
          <div className={styles.pair}>
            <Field label="Tên chứng nhận">
              {(props) => <input {...props} required name="title" maxLength="255" />}
            </Field>
            <Field label="Đơn vị cấp">
              {(props) => <input {...props} required name="issuer" maxLength="255" />}
            </Field>
            <Field label="Ngày cấp (tùy chọn)">
              {(props) => <input {...props} name="issuedAt" type="date" />}
            </Field>
          </div>
        )}
        <Field label={certificate ? 'Ảnh chứng nhận' : label} error={fileError}>
          {(props) => (
            <input
              {...props}
              type="file"
              accept={imageTypes.join(',')}
              multiple={!certificate}
              onChange={(event) => choose(event.currentTarget)}
            />
          )}
        </Field>
        <p className="muted">
          JPEG, PNG hoặc WebP tĩnh{maximumMb ? `, tối đa ${maximumMb} MiB mỗi ảnh` : ''}.
          {certificate ? '' : ' Tối đa 10 ảnh mỗi lượt.'}
        </p>
        {selected.length > 0 && (
          <div className={styles.previewGrid}>
            {selected.map(({ file, previewUrl }, index) => (
              <div key={previewUrl} className="stack">
                <img className={styles.preview} src={previewUrl} alt={'Xem trước ' + file.name} />
                {!certificate && (
                  <Field label={`Mô tả ảnh ${index + 1} · ${file.name}`}>
                    {(props) => <input {...props} name="altText[]" maxLength="300" />}
                  </Field>
                )}
              </div>
            ))}
          </div>
        )}
        <div>
          <Button type="submit" disabled={!selected.length || busy}>
            {certificate ? 'Thêm chứng nhận' : 'Tải ảnh lên'}
          </Button>
        </div>
        <p role="status">{message}</p>
      </fieldset>
    </form>
  )
}
