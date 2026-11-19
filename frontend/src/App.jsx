import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import SiteLayout from './layouts/SiteLayout.jsx';
import { Loading } from './components/UI.jsx';
import { HomePage, CatalogPage, ProductPage, WorkshopPage, TracePage, MapPage, NewsPage } from './pages/PublicPages.jsx';
import { LoginPage, RegisterPage } from './pages/AuthPages.jsx';
import { BuyerRfqsPage, RfqEditorPage, RfqDetailPage } from './pages/RfqPages.jsx';
import { OrdersPage, OrderDetailPage } from './pages/OrderPages.jsx';

function BuyerGuard({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="container padded"><Loading /></div>;
  if (!user) return <Navigate replace to={`/dang-nhap?next=${encodeURIComponent(location.pathname + location.search)}`} />;
  if (user.role !== 'BUYER') return <div className="container padded"><h1>Không có quyền truy cập</h1><p>Trang này dành riêng cho Buyer.</p></div>;
  return children;
}
function NotFound() { return <div className="container padded"><p className="eyebrow">404</p><h1>Không tìm thấy trang này</h1><p>Đường dẫn có thể không còn tồn tại.</p><Link className="btn btn-primary" to="/">Về trang chủ</Link></div>; }
function ComingSoon({ name }) { return <div className="container padded"><h1>{name}</h1><p>Khu vực này do thành viên phụ trách vai trò tương ứng triển khai; Buyer đã có phần riêng tại thanh điều hướng.</p></div>; }
export default function App() {
  return <Routes><Route element={<SiteLayout />}>
    <Route index element={<HomePage />} />
    <Route path="kham-pha" element={<CatalogPage />} />
    <Route path="san-pham/:slug" element={<ProductPage />} />
    <Route path="xuong/:slug" element={<WorkshopPage />} />
    <Route path="lang-nghe" element={<MapPage />} />
    <Route path="truy-xuat/:maLo" element={<TracePage />} />
    <Route path="tin-tuc" element={<NewsPage />} />
    <Route path="dang-nhap" element={<LoginPage />} />
    <Route path="dang-ky" element={<RegisterPage />} />
    <Route path="buyer/rfqs" element={<BuyerGuard><BuyerRfqsPage /></BuyerGuard>} />
    <Route path="buyer/rfqs/moi" element={<BuyerGuard><RfqEditorPage /></BuyerGuard>} />
    <Route path="buyer/rfqs/:id/sua" element={<BuyerGuard><RfqEditorPage /></BuyerGuard>} />
    <Route path="buyer/rfqs/:id" element={<BuyerGuard><RfqDetailPage /></BuyerGuard>} />
    <Route path="buyer/don-hang" element={<BuyerGuard><OrdersPage /></BuyerGuard>} />
    <Route path="buyer/don-hang/:id" element={<BuyerGuard><OrderDetailPage /></BuyerGuard>} />
    <Route path="nghe-nhan/*" element={<ComingSoon name="Không gian Nghệ nhân" />} />
    <Route path="quan-tri/*" element={<ComingSoon name="Ban quản lý làng nghề" />} />
    <Route path="*" element={<NotFound />} />
  </Route></Routes>;
}
