import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource-variable/lora'
import './styles/tokens.css'
import './styles/global.css'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import WorkshopEditor from './pages/WorkshopEditor.jsx'
import DemoLogin from './pages/DemoLogin.jsx'
import { Trace, Village, Workshop } from './pages/PublicPages.jsx'
import { Catalog, ProductDetail } from './pages/ProductPublic.jsx'
import { ProductEditor } from './pages/ProductEditor.jsx'
import { ProductManager } from './pages/ProductManager.jsx'
import { MilestoneAlbum, MilestoneIndex } from './pages/MilestoneAlbum.jsx'
import { RfqHandoff } from './pages/RfqHandoff.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <a className="skip" href="#content">
      Đến nội dung chính
    </a>
    <header className="siteHeader">
      <nav className="container siteNav" aria-label="Điều hướng chính">
        <Link to="/" aria-label="Trang chủ vCraft">
          <img src="/brand/logo.svg" alt="" width="145" height="40" />
        </Link>
        <div className="actions">
          <Link to="/kham-pha">Khám phá</Link>
          <Link to="/lang-nghe">Làng nghề</Link>
          <Link to="/nghe-nhan/ho-so">Hồ sơ xưởng</Link>
          <Link to="/nghe-nhan/san-pham">Quản lý sản phẩm</Link>
        </div>
      </nav>
    </header>
    <main id="content" tabIndex={-1}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/kham-pha" element={<Catalog />} />
        <Route path="/san-pham/:slug" element={<ProductDetail />} />
        <Route path="/nghe-nhan/san-pham" element={<ProductManager />} />
        <Route path="/nghe-nhan/san-pham/tao" element={<ProductEditor />} />
        <Route path="/nghe-nhan/san-pham/:id" element={<ProductEditor />} />
        <Route path="/nghe-nhan/anh-nhat-ky" element={<MilestoneIndex />} />
        <Route path="/nghe-nhan/anh-nhat-ky/:id" element={<MilestoneAlbum />} />
        <Route path="/buyer/rfq/tao" element={<RfqHandoff />} />
        <Route path="/lang-nghe" element={<Village />} />
        <Route path="/xuong/:slug" element={<Workshop />} />
        <Route path="/truy-xuat/:maLo" element={<Trace />} />
        <Route path="/nghe-nhan/ho-so" element={<WorkshopEditor />} />
        <Route path="/dang-nhap" element={<DemoLogin />} />
        <Route
          path="*"
          element={
            <div className="container section">
              <h1>Không tìm thấy trang</h1>
              <Link to="/">Về trang chủ</Link>
            </div>
          }
        />
      </Routes>
    </main>
    <footer className="siteFooter">
      <div className="container">
        <p>vCraft · Tinh hoa làng nghề, muôn phương lan tỏa</p>
      </div>
    </footer>
  </BrowserRouter>,
)
