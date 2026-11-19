import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client.js';
import { onlyInternalNext } from '../utils/format.js';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const refresh = useCallback(async () => {
    try { const response = await apiFetch('/auth/me', { silent401: true }); setUser(response.data); }
    catch { setUser(null); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      if (location.pathname !== '/dang-nhap' && location.pathname !== '/dang-ky') {
        navigate(`/dang-nhap?next=${encodeURIComponent(location.pathname + location.search)}`, { replace: true });
      }
    };
    window.addEventListener('vcraft:unauthorized', onUnauthorized);
    return () => window.removeEventListener('vcraft:unauthorized', onUnauthorized);
  }, [location, navigate]);
  const login = useCallback(async (input, next) => {
    const response = await apiFetch('/auth/login', { method: 'POST', body: input, silent401: true });
    setUser(response.data);
    const destination = response.data.role === 'BUYER' ? onlyInternalNext(next) :
      response.data.role === 'ADMIN' ? '/quan-tri' : '/nghe-nhan';
    navigate(destination, { replace: true });
  }, [navigate]);
  const logout = useCallback(async () => {
    await apiFetch('/auth/logout', { method: 'POST' });
    setUser(null);
    navigate('/', { replace: true });
  }, [navigate]);
  return <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
