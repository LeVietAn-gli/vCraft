import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import { apiFetch, withQuery } from '../api/client.js';
import { Empty, ErrorState, Loading, PageHeading, Pagination, StatusPill, useAsyncData } from '../components/UI.jsx';
import { batchLabel, date, money, number } from '../utils/format.js';
import bowl from '../assets/items/bowl.svg';
import teapot from '../assets/items/teapot.svg';
import vase from '../assets/items/vase-blue.svg';
const fallbackImages = [bowl, teapot, vase];
function imageFor(item, index = 0) { return item?.thumbUrl || item?.images?.[0]?.thumbUrl || fallbackImages[index % fallbackImages.length]; }
function ProductCard({ product, index = 0 }) {
  return <article className="product-card"><Link to={`/san-pham/${product.slug}`} className="product-photo">
    <img src={imageFor(product, index)} alt={product.name} loading="lazy" width="360" height="360" /></Link>
    <div className="product-info"><p className="eyebrow">{product.category?.name || 'Tác phẩm thủ công'}</p>
      <h3><Link to={`/san-pham/${product.slug}`}>{product.name}</Link></h3><p>{product.workshop?.name}</p><strong>{money(product.price)}</strong></div></article>;
}
export function HomePage() {
  const resource = useAsyncData(async () => {
    const [products, workshops, news] = await Promise.all([
      apiFetch('/products?limit=8'), apiFetch('/workshops?limit=3'), apiFetch('/news?limit=3&featured=true'),
    ]);
    return { products: products.data, workshops: workshops.data, news: news.data };
  }, []);
  return <><section className="hero"><div className="container hero-grid"><div className="hero-copy">
    <p className="eyebrow hero-eyebrow">Làng gốm Bát Tràng · Việt Nam</p><h1>Chạm vào <em>tinh hoa</em> làng nghề.</h1>
    <p>Mỗi món đồ thủ công giữ lại một câu chuyện. Khám phá tác phẩm, gặp gỡ nghệ nhân và đặt hàng trực tiếp qua hệ thống điều phối của làng nghề.</p>
    <div className="button-group"><Link to="/kham-pha" className="btn btn-primary">Khám phá tác phẩm →</Link><Link to="/buyer/rfqs/moi" className="btn btn-light">Gửi yêu cầu báo giá</Link></div>
    <div className="hero-note"><span>✦</span> Từ bàn tay nghệ nhân, đến muôn phương.</div>
  </div><div className="hero-visual"><img className="hero-teapot" src={teapot} alt="Minh họa ấm trà gốm Bát Tràng" /><img className="hero-bowl" src={bowl} alt="Minh họa bát gốm" /><span className="hero-art-caption">GỐM · NGHỆ THUẬT · DI SẢN</span></div></div></section>
    <section className="container padded"><div className="section-header section-title"><div><p className="eyebrow">Trưng bày nổi bật</p><h2>Các tác phẩm từ bàn tay Việt</h2></div><Link className="text-link" to="/kham-pha">Xem tất cả →</Link></div>
      {resource.loading ? <Loading /> : resource.error ? <ErrorState error={resource.error} retry={resource.retry} /> : resource.data.products.length ?
        <div className="product-grid">{resource.data.products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div> :
        <Empty title="Các tác phẩm đang được chuẩn bị" detail="Sản phẩm sẽ xuất hiện khi các xưởng được duyệt và công bố." />}
    </section><section className="feature-band"><div className="container feature-grid"><div><p className="eyebrow">Minh bạch từng công đoạn</p><h2>Một mã QR, cả một hành trình.</h2>
      <p>Truy xuất nguồn gốc theo lô sản xuất: từng dấu mốc, từng bức ảnh, từng công đoạn đều có câu chuyện riêng.</p>
      <Link className="text-link" to="/kham-pha">Tìm hiểu sản phẩm →</Link></div><div className="feature-illustration"><img src={vase} alt="Bình gốm men lam" /></div></div></section>
    <section className="container padded"><div className="section-header section-title"><div><p className="eyebrow">Không gian làng nghề</p><h2>Gặp gỡ những người giữ nghề</h2></div><Link className="text-link" to="/lang-nghe">Khám phá bản đồ →</Link></div>
      {!resource.loading && !resource.error && (resource.data.workshops.length ? <div className="workshop-grid">{resource.data.workshops.map((w, i) => <Link key={w.id} className="workshop-card" to={`/xuong/${w.slug}`}><div className="workshop-photo"><img src={imageFor(w, i)} alt={w.name} loading="lazy" /></div>
        <h3>{w.name}</h3><p>{w.address}</p></Link>)}</div> : <Empty title="Chưa có xưởng được công bố" />)}
    </section></>;
}
export function CatalogPage() {
  const [search, setSearch] = useSearchParams();
  const filters = { q: search.get('q') || '', categoryId: search.get('categoryId') || '', workshop: search.get('workshop') || '',
    sort: search.get('sort') || '-createdAt', page: Math.max(1, Number(search.get('page')) || 1), limit: 12 };
  const [query, setQuery] = useState(filters.q);
  const [workshopQuery, setWorkshopQuery] = useState(filters.workshop);
  const [suggestions, setSuggestions] = useState([]);
  const categories = useAsyncData(() => apiFetch('/categories'), []);
  const resource = useAsyncData(() => apiFetch(withQuery('/products', filters)), [filters.q, filters.categoryId, filters.workshop, filters.sort, filters.page]);
  useEffect(() => { setQuery(filters.q); }, [filters.q]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (workshopQuery.trim().length < 2) { setSuggestions([]); return; }
      apiFetch(withQuery('/workshops/suggest', { q: workshopQuery.trim() })).then((r) => setSuggestions(r.data)).catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [workshopQuery]);
  const patch = (changes) => setSearch({ ...Object.fromEntries(Object.entries(filters).filter(([key, value]) => !['limit', 'page'].includes(key) && value)), ...changes, page: '1' });
  return <div className="container padded"><PageHeading eyebrow="Bộ sưu tập" title="Khám phá làng nghề" description="Tìm kiếm những sản phẩm độc đáo theo danh mục, nghệ nhân và phong cách." />
    <form className="catalog-controls" onSubmit={(e) => { e.preventDefault();patch({ q: query.trim() }); }}><div className="search-box"><label htmlFor="search-products">Tìm tác phẩm</label><div className="inline-input"><input id="search-products" type="search" placeholder="Tên sản phẩm, chất liệu…" value={query} onChange={(e) => setQuery(e.target.value)} /><button className="btn btn-primary" type="submit">Tìm</button></div></div>
      <div><label htmlFor="catalog-category">Danh mục</label><select id="catalog-category" value={filters.categoryId} onChange={(e) => patch({ categoryId: e.target.value })}>
        <option value="">Tất cả danh mục</option>{categories.data?.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div className="suggest-control"><label htmlFor="catalog-workshop">Tìm xưởng</label><input id="catalog-workshop" autoComplete="off" placeholder="Nhập tên xưởng…" value={workshopQuery} onChange={(e) => { setWorkshopQuery(e.target.value); if (!e.target.value) patch({ workshop: '' }); }} aria-autocomplete="list" aria-controls="workshop-suggestions" />
        {suggestions.length > 0 && <ul id="workshop-suggestions" className="suggestions" role="listbox">{suggestions.map((w) => <li role="option" aria-selected={filters.workshop === w.slug} key={w.slug}><button type="button" onClick={() => { setWorkshopQuery(w.name);setSuggestions([]);patch({ workshop: w.slug }); }}>{w.name}</button></li>)}</ul>}</div>
      <div><label htmlFor="catalog-sort">Sắp xếp</label><select id="catalog-sort" value={filters.sort} onChange={(e) => patch({ sort: e.target.value })}><option value="-createdAt">Mới nhất</option><option value="createdAt">Cũ nhất</option><option value="price">Giá tăng dần</option><option value="-price">Giá giảm dần</option></select></div></form>
    {(filters.q || filters.categoryId || filters.workshop) && <div className="active-filter"><span>Đang lọc kết quả</span><button className="text-link" onClick={() => { setQuery('');setWorkshopQuery('');setSearch({}); }}>Xóa bộ lọc ×</button></div>}
    {resource.loading ? <Loading /> : resource.error ? <ErrorState error={resource.error} retry={resource.retry} /> : resource.data.data.length ? <>
      <p className="result-count">Tìm thấy {number(resource.data.meta.total)} sản phẩm</p><div className="product-grid">{resource.data.data.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div>
      <Pagination meta={resource.data.meta} onPage={(page) => setSearch({ ...Object.fromEntries(Object.entries(filters).filter(([k, v]) => k !== 'limit' && v)), page: String(page) })} /></> :
      <Empty title="Không tìm thấy sản phẩm phù hợp" detail="Thử thay đổi danh mục, tên xưởng hoặc từ khóa tìm kiếm." />}
  </div>;
}
export function ProductPage() {
  const { slug } = useParams();
  const resource = useAsyncData(() => apiFetch(`/products/${encodeURIComponent(slug)}`), [slug]);
  const [selected, setSelected] = useState(0);
  useEffect(() => setSelected(0), [slug]);
  if (resource.loading) return <div className="container padded"><Loading /></div>;
  if (resource.error) return <div className="container padded"><ErrorState error={resource.error} retry={resource.retry} /></div>;
  const p = resource.data.data;
  const images = p.images?.length ? p.images : [{ imageUrl: imageFor(p) }];
  return <div className="container padded"><Link className="back-link" to="/kham-pha">← Khám phá</Link><div className="product-detail"><div className="gallery"><div className="gallery-main"><img src={images[selected]?.imageUrl || images[0]?.imageUrl} alt={images[selected]?.altText || p.name} /></div>
    <div className="gallery-thumbs">{images.map((img, i) => <button className={i === selected ? 'active' : ''} key={img.id || i} onClick={() => setSelected(i)} aria-label={`Xem ảnh ${i + 1}`}><img src={img.thumbUrl || img.imageUrl} alt="" /></button>)}</div></div>
    <div className="product-detail-info"><p className="eyebrow">{p.category?.name || 'Sản phẩm gốm thủ công'}</p><h1>{p.name}</h1><p className="display-price">{money(p.price)}</p><p>{p.description || 'Sản phẩm thủ công từ xưởng làng nghề.'}</p>
      <div className="divider-line" /><p><strong>Nghệ nhân / xưởng:</strong> <Link to={`/xuong/${p.workshop.slug}`}>{p.workshop.name}</Link></p>
      {p.specifications && <dl className="definition-grid specs">{Object.entries(p.specifications).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{String(v)}</dd></div>)}</dl>}
      <Link className="btn btn-primary btn-large" to={`/buyer/rfqs/moi?sanPham=${encodeURIComponent(p.slug)}`}>Yêu cầu báo giá cho sản phẩm →</Link>
      {p.batchProducts?.length > 0 && <div className="linked-batches"><h2>Truy xuất theo lô</h2>{p.batchProducts.map((b) => <Link key={b.batch.batchCode} to={`/truy-xuat/${b.batch.batchCode}`}>{b.batch.name} →</Link>)}</div>}
    </div></div></div>;
}
export function WorkshopPage() {
  const { slug } = useParams();
  const resource = useAsyncData(() => apiFetch(`/workshops/${encodeURIComponent(slug)}`), [slug]);
  if (resource.loading) return <div className="container padded"><Loading /></div>;
  if (resource.error) return <div className="container padded"><ErrorState error={resource.error} retry={resource.retry} /></div>;
  const w = resource.data.data;
  return <div className="container padded"><Link className="back-link" to="/kham-pha">← Khám phá</Link><div className="workshop-intro"><div><p className="eyebrow">Hồ sơ xưởng · Bát Tràng</p><h1>{w.name}</h1><p>{w.description || 'Không gian lưu giữ những kỹ thuật thủ công độc đáo.'}</p>
    <p><strong>Địa chỉ:</strong> {w.address}</p><StatusPill label={w.isOpenForVisit ? 'Đón khách tham quan' : 'Chưa nhận khách tham quan'} tone={w.isOpenForVisit ? 'success' : 'neutral'} />
    {w.history && <div className="story-block"><h2>Câu chuyện giữ nghề</h2><p>{w.history}</p></div>}</div>
    <div className="workshop-cover"><img src={imageFor(w)} alt={w.name} /></div></div>
    {w.certificates?.length > 0 && <section className="surface"><h2>Chứng nhận</h2><ul>{w.certificates.map((c) => <li key={c.id}>{c.title} · {c.issuer}</li>)}</ul></section>}
    <div className="section-header section-title"><h2>Tác phẩm từ xưởng</h2><Link className="text-link" to={`/kham-pha?workshop=${encodeURIComponent(w.slug)}`}>Xem tất cả →</Link></div>
    {w.products?.length ? <div className="product-grid">{w.products.map((p, i) => <ProductCard key={p.id} product={{ ...p, workshop: w }} index={i} />)}</div> : <Empty title="Chưa có tác phẩm được công bố" />}
  </div>;
}
export function TracePage() {
  const { maLo } = useParams();
  const resource = useAsyncData(() => apiFetch(`/trace/${encodeURIComponent(maLo)}`), [maLo]);
  if (resource.loading) return <div className="container narrow padded"><Loading /></div>;
  if (resource.error) return <div className="container narrow padded"><p className="eyebrow">Truy xuất nguồn gốc</p>
    {resource.error.status === 404 ? <Empty title="Không tìm thấy lô sản xuất" detail="Mã QR không tồn tại hoặc lô chưa công khai. Hãy xác nhận lại mã với xưởng." /> : <ErrorState error={resource.error} retry={resource.retry} />}</div>;
  const b = resource.data.data;
  return <div className="container narrow padded trace-page"><p className="eyebrow">Nhật ký sản xuất / {b.batchCode}</p><h1>{b.name}</h1>
    <div className="section-header"><p>Câu chuyện của một lô sản phẩm thủ công — từ ngày đầu tiên tới thành phẩm.</p>
      <StatusPill label={batchLabel[b.status]} tone={b.status === 'CANCELLED' ? 'danger' : b.status === 'COMPLETED' ? 'success' : 'blue'} /></div>
    {b.status === 'CANCELLED' && <div className="notice warn">Lô sản xuất này đã bị hủy; lịch sử vẫn được lưu lại để bảo đảm truy xuất.</div>}
    <section className="surface trace-workshop"><img src={imageFor(b.workshop)} alt={b.workshop.name} />
      <div><p className="eyebrow">Được tạo bởi</p><h2><Link to={`/xuong/${b.workshop.slug}`}>{b.workshop.name}</Link></h2><p>{b.workshop.address}</p></div></section>
    {b.description && <p className="trace-intro">{b.description}</p>}
    <section><h2>Các sản phẩm cùng lô</h2>{b.products.length ? <div className="trace-product-list">{b.products.map((p) => <Link to={`/san-pham/${p.slug}`} className="trace-product" key={p.slug}><img src={imageFor(p)} alt={p.name} /><div><strong>{p.name}</strong><small>{number(p.quantity)} sản phẩm trong lô</small></div>→</Link>)}</div> : <p>Chưa có sản phẩm đang hiển thị công khai.</p>}</section>
    <section className="trace-history"><p className="eyebrow">Dấu chân người thợ</p><h2>Hành trình tạo tác</h2>{b.milestones.length ? <ol className="timeline">{b.milestones.map((m, i) => <li key={`${m.orderIndex}-${i}`}><div className="timeline-marker">{String(i + 1).padStart(2, '0')}</div>
      <div className="timeline-content"><p className="eyebrow">{m.occurredAt ? date(m.occurredAt) : 'Chưa cập nhật thời gian'}</p><h3>{m.title}</h3>
        <p>{m.description || 'Chưa có mô tả cho công đoạn này.'}</p>{m.images.length > 0 && <div className="timeline-images">{m.images.map((img, j) => <img key={j} src={img.thumbUrl || img.imageUrl} alt={img.altText || m.title} loading="lazy" />)}</div>}</div></li>)}</ol> : <Empty title="Nhật ký chưa có mốc công đoạn" />}</section>
    <div className="trace-footer">Mã truy xuất: <strong>{b.batchCode}</strong> · Mọi sản phẩm trong cùng lô dùng chung mã QR này.</div>
  </div>;
}
export function MapPage() {
  const [visitOnly, setVisitOnly] = useState(false);
  const resource = useAsyncData(() => apiFetch(withQuery('/workshops/map', { isOpenForVisit: visitOnly ? 'true' : undefined })), [visitOnly]);
  const mapRef = useRef(null);
  useEffect(() => {
    if (resource.loading || resource.error || !mapRef.current) return;
    const center = [Number(import.meta.env.VITE_MAP_LAT) || 20.9797, Number(import.meta.env.VITE_MAP_LNG) || 105.9116];
    const map = L.map(mapRef.current, { scrollWheelZoom: false }).setView(center, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' }).addTo(map);
    const points = [];
    for (const w of resource.data.data) {
      const lat = Number(w.latitude), lng = Number(w.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const icon = L.divIcon({ className: '', html: `<span class="map-pin ${w.isOpenForVisit ? 'visiting' : 'closed'}">●</span>`, iconSize: [28, 32], iconAnchor: [14, 32] });
      const marker = L.marker([lat, lng], { icon }).addTo(map);
      const box = document.createElement('div');
      const heading = document.createElement('strong'); heading.textContent = w.name; box.append(heading);
      const sub = document.createElement('p'); sub.textContent = w.isOpenForVisit ? 'Đón khách tham quan' : 'Chưa đón khách tham quan'; box.append(sub);
      const link = document.createElement('a'); link.href = `/xuong/${encodeURIComponent(w.slug)}`; link.textContent = 'Xem xưởng →'; box.append(link);
      marker.bindPopup(box);points.push([lat, lng]);
    }
    if (points.length) map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
    return () => map.remove();
  }, [resource.loading, resource.error, resource.data]);
  return <div className="container padded"><PageHeading eyebrow="Làng nghề trong tầm tay" title="Bản đồ làng nghề" description="Chọn ghim trên bản đồ để gặp gỡ nghệ nhân và tìm xưởng đang nhận khách." />
    <label className="checkbox-label map-filter"><input type="checkbox" checked={visitOnly} onChange={(e) => setVisitOnly(e.target.checked)} />Chỉ hiện xưởng đang nhận khách</label>
    <div className="map-legend"><span><i className="legend-dot visiting" /> Đón khách tham quan</span><span><i className="legend-dot closed" /> Chưa đón khách</span></div>
    {resource.loading ? <Loading /> : resource.error ? <ErrorState error={resource.error} retry={resource.retry} /> :
      <><div ref={mapRef} className="map-container" role="region" aria-label="Bản đồ tương tác vị trí các xưởng" />
        {!resource.data.data.length && <Empty title="Chưa có xưởng với vị trí phù hợp" detail="Thử bỏ bộ lọc đón khách tham quan." />}
        <div className="map-list"><h2>Danh sách xưởng ({resource.data.data.length})</h2>{resource.data.data.map((w) => <div className="map-list-item" key={w.slug}><div><strong><Link to={`/xuong/${w.slug}`}>{w.name}</Link></strong><small>{w.address}</small></div><StatusPill tone={w.isOpenForVisit ? 'success' : 'neutral'} label={w.isOpenForVisit ? 'Đón khách' : 'Chưa đón khách'} /></div>)}</div>
      </>}
  </div>;
}
export function NewsPage() {
  const [category, setCategory] = useState('');
  const resource = useAsyncData(() => apiFetch(withQuery('/news', { category, page: 1, limit: 30 })), [category]);
  const names = { MATERIAL_PRICE: 'Giá nguyên vật liệu', POWER_OUTAGE: 'Lịch cúp điện', SUPPORT_POLICY: 'Chính sách hỗ trợ' };
  return <div className="container padded"><PageHeading eyebrow="Góc cộng đồng" title="Tin làng nghề" description="Cập nhật từ Ban quản lý về vật liệu, hoạt động sản xuất và chính sách." />
    <div className="tab-row">{['', ...Object.keys(names)].map((k) => <button type="button" className={category === k ? 'active' : ''} key={k} onClick={() => setCategory(k)}>{names[k] || 'Tất cả'}</button>)}</div>
    {resource.loading ? <Loading /> : resource.error ? <ErrorState error={resource.error} retry={resource.retry} /> : resource.data.data.length ?
      <div className="news-grid">{resource.data.data.map((n) => <article className="surface" key={n.id}><p className="eyebrow">{names[n.category]}</p><h2>{n.title}</h2><p>{n.content}</p><small>{date(n.publishedAt)}</small></article>)}</div> :
      <Empty title="Chưa có thông báo trong mục này" />}
  </div>;
}
