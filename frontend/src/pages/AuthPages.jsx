import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../api/client.js';
import { Field, FieldErrors, InlineError, SubmitButton } from '../components/UI.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export function LoginPage() {
  const { login, user } = useAuth();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  useEffect(() => { if (user) navigate(user.role === 'BUYER' ? '/buyer/rfqs' : '/', { replace: true }); }, [user, navigate]);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(null);
    try { await login({ email, password }, params.get('next')); }
    catch (e) { setError(e); } finally { setBusy(false); }
  }
  return <div className="container auth-wrap"><section className="auth-panel"><p className="eyebrow">Chào mừng trở lại</p>
    <h1>Đăng nhập</h1><p>Tiếp tục kết nối với những xưởng thủ công giàu câu chuyện.</p>
    <form onSubmit={submit} className="form-stack"><Field label="Email" id="login-email" required><input id="login-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      <Field label="Mật khẩu" id="login-password" required><input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
      <InlineError error={error} /><SubmitButton busy={busy}>Đăng nhập</SubmitButton></form>
    <p className="form-footnote">Chưa có tài khoản? <Link to="/dang-ky">Đăng ký miễn phí</Link></p></section>
    <aside className="auth-aside"><div className="art-stamp">VC</div><h2>Một ngôi làng, ngàn câu chuyện.</h2><p>Hãy bắt đầu yêu cầu báo giá và khám phá tinh hoa gốm thủ công.</p></aside></div>;
}
export function RegisterPage() {
  const [role, setRole] = useState('BUYER');
  const [values, setValues] = useState({ fullName: '', email: '', phone: '', password: '', workshopName: '', workshopAddress: '' });
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  useEffect(() => { apiFetch('/categories').then((res) => setCategories(res.data)).catch(() => {}); }, []);
  const set = (key, value) => setValues((prev) => ({ ...prev, [key]: value }));
  const errors = FieldErrors(error);
  async function submit(event) {
    event.preventDefault();setBusy(true);setError(null);
    try {
      await apiFetch('/auth/register', { method: 'POST', body: {
        role, fullName: values.fullName, email: values.email, phone: values.phone || null, password: values.password,
        ...(role === 'ARTISAN' ? { workshop: { name: values.workshopName, address: values.workshopAddress, categoryIds: selected } } : {}),
      } });
      navigate('/dang-nhap?registered=1');
    } catch (e) { setError(e); } finally { setBusy(false); }
  }
  return <div className="container auth-wrap"><section className="auth-panel"><p className="eyebrow">Gia nhập vCraft</p><h1>Tạo tài khoản</h1>
    <div className="segmented" role="group" aria-label="Loại tài khoản"><button type="button" className={role === 'BUYER' ? 'active' : ''} onClick={() => setRole('BUYER')}>Khách mua hàng</button>
      <button type="button" className={role === 'ARTISAN' ? 'active' : ''} onClick={() => setRole('ARTISAN')}>Nghệ nhân</button></div>
    <form onSubmit={submit} className="form-stack"><Field id="reg-name" label="Họ và tên" required error={errors.fullName}><input id="reg-name" required minLength={2} maxLength={150} value={values.fullName} onChange={(e) => set('fullName', e.target.value)} /></Field>
      <Field id="reg-email" label="Email" required error={errors.email}><input id="reg-email" type="email" required autoComplete="email" value={values.email} onChange={(e) => set('email', e.target.value)} /></Field>
      <Field id="reg-phone" label="Số điện thoại" error={errors.phone}><input id="reg-phone" type="tel" autoComplete="tel" value={values.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
      <Field id="reg-password" label="Mật khẩu" required hint="Tối thiểu 8 ký tự" error={errors.password}><input id="reg-password" type="password" minLength={8} maxLength={128} required autoComplete="new-password" value={values.password} onChange={(e) => set('password', e.target.value)} /></Field>
      {role === 'ARTISAN' && <div className="form-subsection"><h2>Thông tin xưởng</h2><p>Xưởng sẽ ở trạng thái chờ Ban quản lý phê duyệt.</p>
        <Field id="reg-workshop" label="Tên xưởng" required error={errors['workshop.name']}><input id="reg-workshop" required value={values.workshopName} onChange={(e) => set('workshopName', e.target.value)} /></Field>
        <Field id="reg-address" label="Địa chỉ xưởng" required error={errors['workshop.address']}><input id="reg-address" required value={values.workshopAddress} onChange={(e) => set('workshopAddress', e.target.value)} /></Field>
        <fieldset className="category-fieldset"><legend>Danh mục nghề</legend>{categories.map((category) => <label key={category.id} className="checkbox-label"><input type="checkbox" checked={selected.includes(category.id)} onChange={(e) => setSelected((prev) => e.target.checked ? [...prev, category.id] : prev.filter((id) => id !== category.id))} />{category.name}</label>)}</fieldset>
      </div>}
      <InlineError error={error} /><SubmitButton busy={busy}>Tạo tài khoản</SubmitButton></form>
    <p className="form-footnote">Đã có tài khoản? <Link to="/dang-nhap">Đăng nhập</Link></p></section>
    <aside className="auth-aside"><div className="art-stamp">VC</div><h2>Mỗi tác phẩm là một dấu ấn.</h2><p>Đặt hàng thủ công, hoặc giới thiệu nghề của gia đình đến muôn phương.</p></aside></div>;
}
