import { createContext, useContext, useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { apiFetch } from '../api/client.js'
import { useResource } from '../api/useResource.js'
import { Button, Field, Resource } from '../components/UI.jsx'

const Account = createContext(null)
export const useAccount = () => useContext(Account)

export function AccountProvider({ children }) {
  const state = useResource('/auth/me')
  const { reload } = state
  useEffect(() => {
    const expired = () => reload()
    window.addEventListener('vcraft-session-expired', expired)
    return () => window.removeEventListener('vcraft-session-expired', expired)
  }, [reload])
  return <Account.Provider value={{ user: state.data, state, reload }}>{children}</Account.Provider>
}

export function BuyerArea() {
  const { state, user } = useAccount()
  const location = useLocation()
  const next = location.pathname + location.search + location.hash
  if (state.error?.status === 401)
    return <Navigate replace to={'/dang-nhap?' + new URLSearchParams({ next })} />
  return (
    <div className="container section stack">
      <Resource state={state}>
        {() =>
          user.role === 'BUYER' ? (
            <Outlet />
          ) : (
            <section>
              <h1>Khu vực người mua</h1>
              <p>Vui lòng đăng nhập bằng tài khoản Buyer.</p>
              <Link to={'/dang-nhap?' + new URLSearchParams({ next })}>Đổi tài khoản</Link>
            </section>
          )
        }
      </Resource>
    </div>
  )
}

export function AccountMenu() {
  const { user, reload } = useAccount()
  const [error, setError] = useState('')
  const navigate = useNavigate()
  async function logout() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' })
      setError('')
      reload()
      navigate('/')
    } catch (e) {
      setError(e.message)
    }
  }
  return (
    <>
      {user?.role === 'ARTISAN' && (
        <>
          <Link to="/nghe-nhan/ho-so">Hồ sơ xưởng</Link>
          <Link to="/nghe-nhan/san-pham">Quản lý sản phẩm</Link>
          <Link to="/nghe-nhan/lo-san-xuat">Lô sản xuất</Link>
        </>
      )}
      {user?.role === 'BUYER' && (
        <>
          <Link to="/buyer/rfq">Yêu cầu báo giá</Link>
          <Link to="/buyer/don-hang">Đơn hàng</Link>
        </>
      )}
      {user ? (
        <Button variant="secondary" onClick={logout}>
          Đăng xuất
        </Button>
      ) : (
        <Link to="/dang-nhap">Đăng nhập</Link>
      )}
      {error && (
        <span role="alert" className="error">
          {error}
        </span>
      )}
    </>
  )
}

export function AccountForm({ register = false, demo = false }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { reload } = useAccount()
  const navigate = useNavigate()
  const { search } = useLocation()
  const next = new URLSearchParams(search).get('next')
  const destination = next?.startsWith('/buyer/') ? next : '/buyer/rfq'
  async function submit(event) {
    event.preventDefault()
    const body = Object.fromEntries(new FormData(event.currentTarget))
    setBusy(true)
    setError('')
    try {
      if (register)
        await apiFetch('/auth/register', { method: 'POST', body: { ...body, role: 'BUYER' } })
      const { data } = await apiFetch(demo ? '/demo/session' : '/auth/login', {
        method: 'POST',
        body: { email: body.email, password: body.password },
      })
      reload()
      navigate(
        data.role === 'BUYER' ? destination : data.role === 'ARTISAN' ? '/nghe-nhan/ho-so' : '/',
        { replace: true },
      )
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="container narrow section stack">
      <h1>
        {register ? 'Tạo tài khoản người mua' : demo ? 'Đăng nhập tài khoản mẫu' : 'Đăng nhập'}
      </h1>
      <form onSubmit={submit} className="panel stack">
        {register && (
          <>
            <Field label="Họ và tên">
              {(props) => (
                <input {...props} name="fullName" autoComplete="name" maxLength={150} required />
              )}
            </Field>
            <Field label="Số điện thoại">
              {(props) => (
                <input
                  {...props}
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  minLength={8}
                  maxLength={20}
                  required
                />
              )}
            </Field>
          </>
        )}
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
              minLength={register ? 8 : 1}
              autoComplete={register ? 'new-password' : 'current-password'}
              required
            />
          )}
        </Field>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div>
          <Button disabled={busy} type="submit">
            {register ? 'Đăng ký' : 'Đăng nhập'}
          </Button>
        </div>
      </form>
      <div className="actions">
        {(register || demo) && <Link to={'/dang-nhap' + search}>Đăng nhập</Link>}
        {!register && <Link to={'/dang-ky' + search}>Tạo tài khoản người mua</Link>}
        {!demo && import.meta.env.DEV && (
          <Link to={'/dang-nhap/demo' + search}>Tài khoản demo của nhóm</Link>
        )}
      </div>
    </div>
  )
}
