import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api/client.js'
import { Button, Field } from '../components/UI.jsx'

export default function DemoLogin() {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { data } = await apiFetch('/demo/session', {
        method: 'POST',
        body: Object.fromEntries(new FormData(event.currentTarget)),
      })
      navigate(data.role === 'ARTISAN' ? '/nghe-nhan/ho-so' : '/')
    } catch (error) {
      setError(error.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="container narrow section">
      <h1>Đăng nhập demo</h1>
      <form className="panel stack" onSubmit={submit}>
        <Field label="Email">
          {(props) => (
            <input {...props} name="email" type="email" autoComplete="username" required />
          )}
        </Field>
        <Field label="Mật khẩu">
          {(props) => (
            <input
              {...props}
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          )}
        </Field>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div>
          <Button type="submit" disabled={busy}>
            Đăng nhập
          </Button>
        </div>
      </form>
    </div>
  )
}
