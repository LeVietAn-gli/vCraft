import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import logo from '../assets/brand/logo.svg';

export default function SiteLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const links = [{ to: '/', label: 'Trang chủ', end: true }, { to: '/kham-pha', label: 'Khám phá' },
    { to: '/lang-nghe', label: 'Bản đồ làng nghề' }, { to: '/tin-tuc', label: 'Tin cộng đồng' }];
  if (user?.role === 'BUYER') links.push({ to: '/buyer/rfqs', label: 'Yêu cầu báo giá' }, { to: '/buyer/don-hang', label: 'Đơn hàng' });
  if (user?.role === 'ARTISAN') links.push({ to: '/nghe-nhan', label: 'Xưởng của tôi' });
  if (user?.role === 'ADMIN') links.push({ to: '/quan-tri', label: 'Quản trị' });
  async function signOut() {
    setBusy(true);setLogoutError('');
    try { await logout(); } catch (error) { setLogoutError(error.message || 'Không thể đăng xuất'); }
    finally { setBusy(false); }
  }
  return <div className="site"><a className="skip-link" href="#main">Bỏ qua menu</a>
    <header className="site-header"><div className="container header-inner">
      <Link to="/" className="brand" aria-label="vCraft — Trang chủ"><img src={logo} alt="vCraft" /></Link>
      <button type="button" className="menu-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="main-navigation">{open ? 'Đóng ✕' : 'Menu ☰'}</button>
      <nav id="main-navigation" className={open ? 'nav-links open' : 'nav-links'} aria-label="Điều hướng chính">
        {links.map(({ to, label, end }) => <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>{label}</NavLink>)}
      </nav><div className="account-area">{user ? <><span className="account-name" title={user.email}>{user.fullName}</span>
        <button type="button" className="btn btn-ghost btn-small" disabled={busy} onClick={signOut}>Đăng xuất</button></> :
        <><Link to="/dang-nhap" className="btn btn-ghost btn-small">Đăng nhập</Link><Link to="/dang-ky" className="btn btn-primary btn-small">Đăng ký</Link></>}</div>
    </div>{logoutError && <div className="container inline-error" role="alert">{logoutError}</div>}</header><main id="main" className="site-main"><Outlet /></main>
    <footer className="site-footer"><div className="container footer-grid"><div><strong>vCraft</strong><p>Tinh hoa làng nghề, muôn phương lan tỏa.</p></div>
      <div><p>Không gian triển lãm và kết nối nghề thủ công Việt Nam.</p><span>© 2026 vCraft · INT3306</span></div></div></footer>
  </div>;
}
