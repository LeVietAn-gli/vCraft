# 06 — Thiết kế giao diện (UI Design)

**Phụ trách chính:** N2 (design system, nhận diện: N2-T1-02; trang chủ: N2-T1-08; rà soát UI/UX: N2-T6-04). N1 và N3 dùng chung bộ design token và component trong tài liệu này.

Đề yêu cầu giao diện **image-centric, đẹp, CSS tự sáng tạo, không dùng thư viện có sẵn**. Giao diện chiếm **20% điểm** (N2-T6-04).

> Bảng màu và chất liệu bên dưới lấy **gốm Bát Tràng** làm ví dụ. Nếu nhóm chốt nghề khác ở N2-T1-02 thì chỉ cần thay giá trị trong `tokens.css`; cấu trúc tài liệu giữ nguyên.

---

## 1. Định hướng thiết kế

**Ý tưởng chủ đạo: "Phòng trưng bày số".** Mỗi trang giống như đang đi qua một gian triển lãm: ảnh lớn là nhân vật chính, chữ ít và có nhịp, nhiều khoảng trống.

| Nguyên tắc | Áp dụng cụ thể |
|-----------|----------------|
| **Ảnh là nội dung chính** | Grid ảnh lớn, ảnh tràn viền ở hero; nhiều trang không có card viền mà dùng ảnh và chữ trên nền giấy |
| **Chất liệu thủ công** | Nền màu giấy dó/ngà, viền mảnh như nét vẽ men, họa tiết nhỏ lấy từ hoa văn gốm (dùng tiết chế) |
| **Kể chuyện theo thời gian** | Timeline nhật ký sản xuất là "chữ ký" thị giác của vCraft, xuất hiện ở trang truy xuất, trang lô và trang sản phẩm |
| **Rõ ràng ở khu vực quản lý** | Trang của Buyer, Artisan, Admin ưu tiên dễ thao tác; cùng bộ màu nhưng ít trang trí |
| **Tôn trọng người dùng** | Tương phản đủ, thao tác được bằng bàn phím, không phụ thuộc vào màu sắc, có giảm chuyển động |

## 2. Design tokens

Toàn bộ token đặt trong `frontend/src/styles/tokens.css` dưới dạng biến CSS. **Không viết mã màu trực tiếp** trong file `*.module.css`.

### 2.1. Màu sắc

| Token | Giá trị | Cảm hứng | Dùng cho |
|-------|---------|----------|----------|
| `--color-ink` | `#231F1C` | Màu than | Chữ chính |
| `--color-ink-soft` | `#5C544D` | | Chữ phụ, chú thích |
| `--color-ivory` | `#F7F2EA` | Men ngà | Nền trang |
| `--color-paper` | `#FFFDF9` | Giấy dó | Nền thẻ, form |
| `--color-line` | `#E4DBCF` | | Viền, đường kẻ |
| `--color-lam` | `#1F4E79` | Men lam | Màu chính: nút chính, link, pin xưởng nhận khách |
| `--color-lam-dark` | `#163A5C` | | Hover/active của màu chính, nền footer |
| `--color-terra` | `#A84A28` | Đất nung | Màu nhấn: CTA phụ, điểm trên timeline |
| `--color-terra-light` | `#F3E1D7` | | Nền nhấn nhẹ |
| `--color-celadon` | `#5E7F6E` | Men ngọc | Trang trí, icon lớn (không dùng cho chữ nhỏ) |
| `--color-gold` | `#B8862F` | Men vàng | Chỉ để trang trí; badge dùng chữ `--color-ink` |
| `--color-success` | `#3E6B4F` | | Trạng thái thành công |
| `--color-warn` | `#8A5A12` | | Cảnh báo, chờ xử lý |
| `--color-danger` | `#A6342B` | | Lỗi, từ chối, "Đã hủy" |

**Tỷ lệ tương phản** (tính theo công thức WCAG 2.x):

| Cặp màu | Tỷ lệ | Mức đạt |
|---------|-------|---------|
| `ink` trên `ivory` | 14.67 : 1 | AA, AAA |
| `ink-soft` trên `ivory` | 6.66 : 1 | AA |
| `lam` trên `ivory` | 7.77 : 1 | AA, AAA |
| `paper` trên `lam` (chữ của nút chính) | 8.53 : 1 | AA, AAA |
| `terra` trên `ivory` | 5.13 : 1 | AA |
| `paper` trên `terra` | 5.62 : 1 | AA |
| `terra` trên `terra-light` | 4.51 : 1 | AA (vừa đủ) |
| `danger` / `success` / `warn` trên `paper` | 6.57 / 6.04 / 5.82 : 1 | AA |
| `ink` trên `gold` | 5.05 : 1 | AA |
| `celadon` trên `ivory` | 3.98 : 1 | **Chỉ đạt** với chữ lớn hoặc thành phần UI (≥ 3 : 1) |
| `gold` trên `ivory` | 2.90 : 1 | **Không đạt**: chỉ dùng làm trang trí |

> Chuẩn AA yêu cầu chữ thường ≥ 4.5 : 1; chữ lớn và thành phần UI ≥ 3 : 1. Khi thêm màu mới, hãy kiểm tra lại bằng công cụ đo tương phản.

### 2.2. Typography

| Vai trò | Font đề xuất | Ghi chú |
|---------|--------------|---------|
| Tiêu đề, tên sản phẩm | **Lora** (serif) | Mang tinh thần triển lãm, biên tập |
| Nội dung, UI | **Be Vietnam Pro** (sans-serif) | Thiết kế riêng cho tiếng Việt, dấu rõ ràng |

Cả hai font lấy từ Google Fonts. **Trước khi chốt, kiểm tra lại subset `vietnamese` của từng font** và thử các chữ có dấu chồng như "Ượ", "Ỡ", "ặ". Có thể tự host font trong `public/fonts` để chạy demo không cần mạng.

| Token | Cỡ | Line-height | Dùng cho |
|-------|----|-------------|----------|
| `--text-display` | `clamp(2.5rem, 5vw, 4rem)` | 1.1 | Hero trang chủ |
| `--text-h1` | `clamp(2rem, 3.5vw, 2.75rem)` | 1.2 | Tiêu đề trang |
| `--text-h2` | `1.75rem` | 1.25 | Tiêu đề khối |
| `--text-h3` | `1.25rem` | 1.35 | Tên thẻ, tiêu đề mốc |
| `--text-body` | `1rem` | 1.65 | Nội dung |
| `--text-small` | `0.875rem` | 1.5 | Chú thích, meta |
| `--text-micro` | `0.75rem` | 1.4 | Badge, nhãn; viết hoa, giãn chữ `0.08em` |

### 2.3. Khoảng cách, bo góc, đổ bóng, chuyển động

| Nhóm | Token |
|------|-------|
| Spacing (hệ 4px) | `--space-1: 4px` · `-2: 8px` · `-3: 12px` · `-4: 16px` · `-6: 24px` · `-8: 32px` · `-12: 48px` · `-16: 64px` · `-24: 96px` |
| Bo góc | `--radius-sm: 4px` (input, badge) · `--radius-md: 8px` (thẻ, nút) · `--radius-lg: 16px` (dialog) · `--radius-pill: 999px` |
| Đổ bóng | `--shadow-sm: 0 1px 2px rgb(35 31 28 / .06)` · `--shadow-md: 0 8px 24px rgb(35 31 28 / .10)` |
| Chuyển động | `--ease: cubic-bezier(.2,.7,.2,1)` · `--dur-fast: 150ms` · `--dur: 250ms` · `--dur-slow: 500ms` |
| Layout | `--container: 1200px` · `--container-narrow: 760px` (bài viết, trang truy xuất) |

### 2.4. Breakpoint (mobile-first)

| Tên | Điều kiện | Grid catalog |
|-----|-----------|--------------|
| Mobile | mặc định | 2 cột (1 cột khi màn hình < 360px) |
| Tablet | `min-width: 640px` | 3 cột |
| Desktop | `min-width: 1024px` | 4 cột |
| Wide | `min-width: 1280px` | 4 cột, nhiều khoảng trống hơn |

CSS thuần không dùng được biến trong media query, nên các giá trị breakpoint được ghi cố định và thống nhất theo bảng trên.

### 2.5. File `tokens.css` mẫu

```css
:root {
  /* Màu */
  --color-ink: #231F1C;      --color-ink-soft: #5C544D;
  --color-ivory: #F7F2EA;    --color-paper: #FFFDF9;   --color-line: #E4DBCF;
  --color-lam: #1F4E79;      --color-lam-dark: #163A5C;
  --color-terra: #A84A28;    --color-terra-light: #F3E1D7;
  --color-celadon: #5E7F6E;  --color-gold: #B8862F;
  --color-success: #3E6B4F;  --color-warn: #8A5A12;    --color-danger: #A6342B;

  /* Font */
  --font-serif: 'Lora', Georgia, serif;
  --font-sans: 'Be Vietnam Pro', system-ui, sans-serif;

  /* Spacing, radius, shadow, motion … (theo bảng 2.3) */
  --space-4: 16px;  --radius-md: 8px;  --dur: 250ms;
  --focus-ring: 0 0 0 3px var(--color-paper), 0 0 0 5px var(--color-lam);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

## 3. Nhận diện

| Thành phần | Yêu cầu |
|-----------|---------|
| Logo | Tự thiết kế (SVG), gồm biểu tượng lấy từ hình dáng sản phẩm của nghề (ví dụ dáng bình gốm) và chữ "vCraft". Có bản ngang và bản biểu tượng (favicon) |
| Slogan | "Tinh hoa làng nghề, muôn phương lan tỏa": hiển thị ở hero và footer |
| Họa tiết | 1–2 họa tiết SVG nhỏ (ví dụ hoa văn men lam) làm đường phân cách và nền khối. Không phủ kín trang |
| Icon | Bộ icon SVG nét mảnh (stroke 1.5px), đồng bộ một kiểu. Có thể tự vẽ, hoặc lấy từ bộ icon mã nguồn mở có ghi nguồn. Icon không phải "thư viện UI", nhưng nên hỏi giảng viên để chắc chắn |
| Ảnh | Ảnh thật của xưởng và sản phẩm, có quyền sử dụng; **ghi nguồn** trong README (N2-T1-08, N2-T6-08) |

## 4. Hướng dẫn dùng ảnh

| Loại ảnh | Tỷ lệ khung | Kích cỡ dùng | Ghi chú |
|----------|-------------|--------------|---------|
| Thẻ sản phẩm (grid) | **4 : 5** | `thumbUrl` | `object-fit: cover`; ảnh đại diện lấy theo `isPrimary` |
| Gallery chi tiết sản phẩm | 4 : 5 hoặc theo ảnh gốc | `imageUrl` | Ảnh lớn kèm dải thumbnail; bấm vào để mở lightbox |
| Hero xưởng / trang chủ | **16 : 9** (mobile 4 : 5) | `imageUrl` | Phủ một lớp gradient tối để chữ trắng trên ảnh vẫn đủ tương phản |
| Ảnh mốc nhật ký | **4 : 3** | `thumbUrl` trong timeline, `imageUrl` khi phóng to | Tối đa 3 ảnh hiển thị, phần còn lại hiện "+N" |
| Popup bản đồ | 16 : 9 | `thumbUrl` | |
| Chứng nhận | Theo ảnh gốc | `fileUrl` | Bấm vào để xem lớn |

**Quy tắc chung:**
- Luôn khai báo `width`, `height` (hoặc `aspect-ratio`) để không bị nhảy bố cục; dùng `loading="lazy"` cho ảnh dưới màn hình đầu tiên và `fetchpriority="high"` cho ảnh hero.
- `srcset="{thumbUrl} 400w, {imageUrl} 1600w"` kèm `sizes` theo số cột của grid.
- Trong lúc tải ảnh, hiển thị nền `--color-line` có hiệu ứng shimmer nhẹ. Nếu ảnh lỗi, hiển thị placeholder SVG có logo, không để biểu tượng ảnh vỡ.
- `alt` lấy từ `altText`; nếu trống thì dùng tên sản phẩm hoặc tiêu đề mốc. Ảnh chỉ để trang trí thì dùng `alt=""`.

## 5. Bộ component tự viết

Đặt trong `frontend/src/components/`, mỗi component có một file `*.module.css`.

| Component | Biến thể / trạng thái | Ghi chú accessibility |
|-----------|----------------------|------------------------|
| `Button` | `primary` (nền lam), `secondary` (viền), `ghost`, `danger`; cỡ `sm`/`md`/`lg`; `loading` (spinner + `aria-busy`), `disabled` | Dùng `<button>`; luôn có `:focus-visible` (`--focus-ring`) |
| `TextField`, `TextArea`, `Select`, `Checkbox`, `Switch` | default, focus, error, disabled | `<label>` gắn với input; lỗi gắn qua `aria-describedby`; trường bắt buộc có dấu `*` và `aria-required` |
| `MoneyInput`, `DateInput` | | Hiển thị `1.250.000 ₫`, gửi lên server dạng số; ngày hiển thị dd/MM/yyyy |
| `ImageUploader` | kéo-thả, chọn nhiều file, preview, tiến trình, lỗi theo từng file, sắp xếp, đặt ảnh đại diện | Có nút thay thế cho thao tác kéo-thả (sắp xếp bằng nút ↑ ↓) |
| `ProductCard` | thường, có giá / "Liên hệ" | Toàn thẻ là một link; hover phóng ảnh nhẹ (`scale(1.03)`) |
| `WorkshopCard` | có hoặc không có badge "Đón khách" | |
| `Gallery` + `Lightbox` | | Lightbox: phím `←` `→` `Esc`, focus trap |
| `Timeline` (N2-T3-03) | dọc (mobile), có thể ngang trên desktop; mốc thiếu ngày hoặc ảnh | Dùng `<ol>`; ngày đặt trong `<time datetime>` |
| `StatusBadge` | theo bảng ở mục 7 | Luôn có **chữ**, không chỉ hiển thị màu |
| `StatusStepper` | các bước RFQ, bước hiện tại, các bước đã qua | `aria-current="step"` |
| `Dialog` / `ConfirmDialog` | | `<dialog>` gốc hoặc tự quản lý focus; `Esc` để đóng; trả focus về nút đã mở |
| `DataTable` | sắp xếp, rỗng, đang tải; **trên mobile chuyển thành danh sách thẻ** | `<table>` có `<th scope>` |
| `Tabs` | | `role="tablist"`, di chuyển bằng phím mũi tên |
| `Pagination` | | `<nav aria-label="Phân trang">` |
| `Toast` | success, error, info | `role="status"` / `role="alert"` |
| `Skeleton`, `EmptyState`, `ErrorState` | `ErrorState` có nút "Thử lại" | Dùng chung cho mọi màn hình |
| `MapPin` (SVG) | nhận khách / không nhận khách / đang chọn | Phân biệt bằng **màu và hình dạng** (mục 8.5) |
| `QrCard` | ảnh QR, mã lô, nút "Tải PNG", "Tải SVG", "In" | Có CSS `@media print` riêng cho nhãn in |

## 6. Layout và điều hướng

| Layout | Cấu trúc |
|--------|----------|
| `PublicLayout` | Header (logo · Khám phá · Làng nghề · Tin tức · nút "Gửi yêu cầu báo giá" · Đăng nhập hoặc avatar) → nội dung → Footer (màu `lam-dark`, slogan, liên hệ BQL, nguồn bản đồ và nguồn ảnh) |
| `DashboardLayout` | Desktop: sidebar trái theo vai trò + vùng nội dung. Mobile: header kèm nút menu mở drawer |

**Header:** ở trang chủ, header trong suốt nằm trên hero; khi cuộn xuống thì chuyển sang nền `paper` có đổ bóng. Ở các trang khác, header luôn có nền.

**Menu theo vai trò** (N1-T2-02):

| Vai trò | Menu khu vực quản lý |
|---------|---------------------|
| Buyer | Yêu cầu báo giá · Đơn hàng |
| Artisan | Hồ sơ xưởng · Sản phẩm · Lô sản xuất · Lời mời báo giá · Nhiệm vụ sản xuất |
| Admin | Tổng quan · Duyệt xưởng · Yêu cầu và chia đơn · Đơn toàn làng · Tin cộng đồng · Danh mục |

Artisan có xưởng `PENDING` hoặc `REJECTED` chỉ thấy mục "Hồ sơ xưởng", kèm banner trạng thái (và lý do nếu bị từ chối).

## 7. Hiển thị trạng thái

| Đối tượng | Trạng thái → nhãn (màu) |
|-----------|-------------------------|
| RFQ | `DRAFT` Nháp (xám) · `SENT` Đã gửi (lam) · `BIDDING` Đang nhận báo giá (lam) · `ACCEPTED` Đã chốt (vàng, chữ ink) · `IN_PRODUCTION` Đang sản xuất (terra) · `DELIVERED` Đã giao (success) |
| Phương án | `DRAFT` Nháp · `PENDING_BUYER` Chờ bạn duyệt (warn) · `ACCEPTED` Đã chấp nhận (success) · `REJECTED` Đã từ chối (danger) |
| Đơn hàng | `IN_PRODUCTION` Đang sản xuất · `READY` Chờ xác nhận nhận hàng (warn) · `DELIVERED` Đã nhận (success) |
| Nhiệm vụ | `ASSIGNED` Mới giao · `IN_PROGRESS` Đang làm · `COMPLETED` Đã bàn giao |
| Lô | `PLANNED` Kế hoạch · `IN_PROGRESS` Đang sản xuất · `COMPLETED` Hoàn thành · `CANCELLED` **Đã hủy** (danger) |
| Xưởng | `PENDING` Chờ duyệt (warn) · `APPROVED` Đã duyệt (success) · `REJECTED` Bị từ chối (danger) |
| Sản phẩm | `VISIBLE` Đang hiển thị · `HIDDEN` Đang ẩn (xám) |

Nhãn hiển thị phụ thuộc vai trò người xem. Ví dụ phương án `PENDING_BUYER` hiện "Chờ bạn duyệt" với Buyer, và "Chờ Buyer duyệt" với Admin.

## 8. Đặc tả các trang chính

### 8.1. Trang chủ `/` (N2-T1-08, N1-T2-03)

```
┌───────────────────────────────────────────────────────────┐
│ [logo]   Khám phá  Làng nghề  Tin tức      [Gửi RFQ] [👤] │ ← trong suốt
│                                                           │
│        ẢNH HERO TRÀN VIỀN (nghệ nhân bên bàn xoay)         │
│        Tinh hoa làng nghề,                                │
│        muôn phương lan tỏa                                │
│        [Khám phá sản phẩm]  [Xem bản đồ làng]             │
├───────────────────────────────────────────────────────────┤
│ Câu chuyện nghề: 2 cột (ảnh | đoạn văn ngắn, chữ serif)    │
├───────────────────────────────────────────────────────────┤
│ Sản phẩm tiêu biểu: grid 4 cột, ảnh 4:5     [Xem tất cả →] │
├───────────────────────────────────────────────────────────┤
│ Gặp gỡ nghệ nhân: dải thẻ xưởng cuộn ngang (scroll-snap)   │
├───────────────────────────────────────────────────────────┤
│ Bản đồ thu nhỏ + CTA "Ghé thăm xưởng"                     │
├───────────────────────────────────────────────────────────┤
│ Tin cộng đồng nổi bật (3 thẻ)                              │
├───────────────────────────────────────────────────────────┤
│ Khối CTA mua sỉ: "Cần đặt số lượng lớn?" [Gửi yêu cầu]    │
└───────────────────────────────────────────────────────────┘
```

Mỗi khối lấy dữ liệu từ API riêng và có trạng thái loading/empty riêng. Một khối lỗi không làm hỏng cả trang.

### 8.2. Khám phá `/kham-pha` (N2-T2-05, N1-T4-05)

- Thanh lọc gồm ô tìm kiếm, chip danh mục, autocomplete xưởng, khoảng giá và sắp xếp. Trên mobile, thanh lọc mở thành drawer "Bộ lọc (n)".
- Mọi bộ lọc được đồng bộ vào query string (`?categoryId=…&workshop=…&page=2`), nên refresh hoặc chia sẻ link vẫn giữ nguyên kết quả.
- Grid ảnh lớn có phân trang. Có thể thêm nút "Xem thêm"; nếu dùng thì vẫn cập nhật `page` trong URL.
- Khi không có kết quả: hiển thị `EmptyState` kèm gợi ý xóa bộ lọc.

### 8.3. Chi tiết sản phẩm `/san-pham/:slug` (N2-T2-06)

- Desktop chia 2 cột: gallery bên trái (khoảng 60%); bên phải là tên (serif), xưởng, giá hoặc "Liên hệ báo giá", bảng `specifications`, mô tả, CTA **"Yêu cầu báo giá số lượng lớn"** (mở form RFQ đã điền sẵn sản phẩm và danh mục).
- Bên dưới: "Hành trình làm nên sản phẩm" (timeline rút gọn của lô gần nhất, có link tới trang truy xuất) → thẻ xưởng → sản phẩm cùng xưởng.

### 8.4. Hồ sơ xưởng `/xuong/:slug` (N2-T2-06)

Hero ảnh xưởng → tên, địa chỉ, badge "Đón khách tham quan" kèm giờ mở cửa → **câu chuyện gia đình** (bố cục dạng bài viết, chữ serif, có thể chèn ảnh) → gallery xưởng → chứng nhận (lưới ảnh nhỏ) → sản phẩm → các lô công khai → bản đồ nhỏ chỉ vị trí xưởng.

### 8.5. Bản đồ làng nghề `/lang-nghe` (N2-T4-01, N2-T4-02)

- Desktop: bản đồ chiếm khoảng 70% chiều rộng, bên cạnh là danh sách xưởng có thể cuộn. Bấm vào một thẻ trong danh sách thì bản đồ di chuyển tới pin tương ứng và mở popup. Mobile: bản đồ toàn màn hình, danh sách nằm trong bottom sheet kéo lên được.
- **Pin:** xưởng nhận khách là pin màu `lam` có biểu tượng cửa mở; xưởng không nhận khách là pin màu `ink-soft` dạng chấm tròn nhỏ. Hai loại khác nhau cả **màu lẫn hình dạng**. Có chú giải ở góc bản đồ.
- **Popup:** ảnh 16 : 9, tên, mô tả ngắn, giờ mở cửa hôm nay, link "Xem xưởng →".
- Bộ lọc: "Chỉ xưởng đón khách" và lọc theo danh mục.
- Luôn hiển thị attribution `© OpenStreetMap contributors`.
- *(Điểm cộng)* Nút chuyển sang **"Làng ảo"**: một ảnh minh họa làng tự vẽ, hiển thị bằng Leaflet `CRS.Simple`, đi qua các ngõ như một mê cung.

### 8.6. Truy xuất `/truy-xuat/:maLo` (N1-T3-08): thiết kế mobile-first

Đây là trang được mở nhiều nhất trên điện thoại, ngay sau khi khách quét QR.

```
┌─────────────────────────┐
│ [logo vCraft]           │
│ Mã lô BT7K2QX9          │
│ Lô bình men lam 11/2026 │
│ [Hoàn thành] 01–18/11   │  ← badge; lô hủy thì hiện nhãn "Đã hủy" màu danger
├─────────────────────────┤
│ [ảnh] Xưởng gốm Minh Đức│
│ Bát Tràng · Xem xưởng → │
├─────────────────────────┤
│ Sản phẩm trong lô (n)   │
│ [thẻ][thẻ] cuộn ngang   │
├─────────────────────────┤
│ Hành trình sản xuất     │
│ ● 01/11 Nhào đất        │
│ │ [ảnh][ảnh][+2]        │
│ ● 05/11 Vuốt cốt        │
│ │ (Chưa có ảnh)         │  ← mốc thiếu dữ liệu: hiển thị đúng như vậy
│ ● —— Nung lò            │  ← không có ngày
├─────────────────────────┤
│ Lưu ý: QR dẫn tới dữ    │
│ liệu do xưởng cung cấp. │
└─────────────────────────┘
```

- Cột chữ hẹp (`--container-narrow`), chữ thân tối thiểu 16px, vùng chạm ≥ 44 × 44px.
- 404 khi mã sai: trang thân thiện có minh họa, kèm hướng dẫn "Kiểm tra lại mã trên nhãn" và link về trang chủ.

### 8.7. Khu vực Buyer

| Trang | Nội dung chính |
|-------|----------------|
| Danh sách RFQ | Tab lọc theo trạng thái; mỗi RFQ là một thẻ gồm mã, tiêu đề, số lượng, badge và **"Việc cần làm tiếp"** (ví dụ "Có phương án chờ duyệt", "Xác nhận nhận hàng") (N1-T3-01) |
| Form RFQ | Chia nhóm trường: Sản phẩm → Số lượng & thời hạn → Liên hệ & giao hàng. Tự điền thông tin liên hệ; nếu tạo từ sản phẩm thì hiển thị sản phẩm tham khảo; có nút "Lưu nháp" và "Gửi yêu cầu" |
| Chi tiết RFQ | `StatusStepper` ở đầu trang → thông tin yêu cầu → xưởng được mời → **bảng so sánh báo giá** → khối **phương án chờ duyệt** (bảng xưởng / số lượng / đơn giá / thành tiền / hạn, có tổng; nút "Chấp nhận" mở `ConfirmDialog` nhắc lại tổng tiền; nút "Từ chối" mở dialog có ô lý do tùy chọn) |
| Đơn hàng | Thanh tiến độ toàn đơn; tiến độ từng xưởng; nút "Xác nhận đã nhận hàng" chỉ xuất hiện khi đơn `READY` |

### 8.8. Khu vực Artisan

Ưu tiên thao tác chính (N2-T4-03), không có dashboard thống kê.

| Trang | Nội dung chính |
|-------|----------------|
| Hồ sơ xưởng | Form chia khối: Thông tin · Câu chuyện · Ảnh xưởng · Chứng nhận · Danh mục · Vị trí (bấm chọn trên bản đồ) · Đón khách và giờ mở cửa · Nhận đơn |
| Sản phẩm | Lưới thẻ có badge trạng thái; form chia hai bước "Thông tin" → "Ảnh" (vì phải tạo sản phẩm trước rồi mới upload ảnh) |
| Lô sản xuất | Danh sách lô; trang chi tiết gồm sản phẩm trong lô, **trình chỉnh sửa timeline** (thêm mốc, sửa, đổi thứ tự bằng nút ↑ ↓, upload ảnh), công tắc công khai và `QrCard` |
| Lời mời báo giá | Danh sách có badge "Mới" cho lời mời chưa xem; trang chi tiết gồm thông tin RFQ và form báo giá (bị khóa kèm giải thích nếu đã quá hạn hoặc đã khóa) |
| Nhiệm vụ | Thẻ nhiệm vụ gồm mã đơn, số lượng, hạn; cập nhật số lượng hoàn thành; nút "Bắt đầu" / "Hoàn thành & bàn giao" |

### 8.9. Khu vực Admin

| Trang | Nội dung chính |
|-------|----------------|
| Tổng quan | 3 ô số liệu (xưởng chờ duyệt, RFQ đang xử lý, đơn đang sản xuất); mỗi ô là link tới trang danh sách tương ứng |
| Duyệt xưởng | Danh sách hồ sơ chờ duyệt → trang chi tiết (ảnh, chứng nhận, câu chuyện, vị trí) → nút "Duyệt" / "Từ chối" (bắt buộc nhập lý do) |
| Chia đơn | Bảng báo giá ở bên trái; bảng phân bổ ở bên phải với ô nhập số lượng cho từng xưởng; thanh tổng `đã chia / cần chia` đổi màu khi thiếu hoặc vượt; lỗi từ server hiển thị cạnh từng dòng; nút "Gửi cho Buyer" chỉ bật khi tổng đã khớp |
| Đơn toàn làng | Bảng lọc theo trạng thái và xưởng; trang chi tiết tiến độ từng xưởng |
| Tin cộng đồng | Tab theo 3 nhóm; form soạn bài có ảnh bìa, công tắc "Nổi bật" và các nút Đăng / Ẩn |

## 9. Responsive và accessibility

**Responsive:**
- Viết CSS mobile-first; layout dùng Grid với `repeat(auto-fill, minmax(…))` khi phù hợp.
- Bảng dữ liệu trên mobile chuyển thành danh sách thẻ (dùng chung component `DataTable`).
- Form trên mobile hiển thị 1 cột; nút hành động chính đặt cố định ở đáy màn hình (sticky).
- Thử ở các độ rộng 360, 768, 1024 và 1440px (N2-T5-05).

**Accessibility (N1-T5-05, N2-T6-04):**
- Tương phản theo mục 2.1. Không truyền tải thông tin chỉ bằng màu.
- Mọi thao tác đều làm được bằng bàn phím; `:focus-visible` luôn hiện rõ; có link "Bỏ qua tới nội dung chính".
- Dialog, lightbox và drawer có focus trap, đóng được bằng `Esc` và trả focus về chỗ cũ.
- Dùng HTML có ngữ nghĩa: `header`, `nav`, `main`, `footer`; tiêu đề theo đúng thứ bậc; `<button>` cho hành động, `<a>` cho điều hướng.
- Thuộc tính `lang="vi"` trên thẻ `<html>`; mỗi trang có `<title>` riêng.
- Tôn trọng `prefers-reduced-motion`.

## 10. Hiệu ứng (motion)

| Vị trí | Hiệu ứng | Thời lượng |
|--------|----------|-----------|
| Thẻ sản phẩm | Ảnh `scale(1.03)`, tên chuyển màu lam khi hover | `--dur` |
| Nút | Đổi nền, `translateY(-1px)` | `--dur-fast` |
| Khối nội dung khi cuộn tới | Fade + trượt lên 12px (dùng `IntersectionObserver`, mỗi khối chỉ chạy một lần) | `--dur-slow` |
| Timeline | Đường dọc "vẽ" dần, điểm mốc hiện lần lượt | `--dur-slow` |
| Header trang chủ | Chuyển từ trong suốt sang có nền khi cuộn | `--dur` |
| Dialog, drawer | Fade + scale 0.98 → 1 / trượt vào từ cạnh | `--dur` |

Chỉ animate `transform` và `opacity`, không animate `width`, `height` hay `top`.

## 11. Checklist rà soát UI/UX (N2-T6-04)

- [ ] Màu, font và logo đồng nhất ở mọi trang của cả 3 vai trò
- [ ] Không có mã màu viết trực tiếp ngoài `tokens.css`
- [ ] Không dùng thư viện UI hay CSS framework
- [ ] Ảnh đúng tỷ lệ, không méo, không nhảy bố cục; danh sách chỉ tải `thumbUrl`
- [ ] Mọi màn hình có loading, empty và error; error có nút "Thử lại"
- [ ] Refresh các URL sâu không bị 404; bộ lọc giữ được sau refresh
- [ ] Trang truy xuất hiển thị tốt trên điện thoại thật, kể cả lô đã hủy, mốc thiếu dữ liệu và mã sai
- [ ] QR tải về và in được; quét bằng điện thoại mở đúng trang
- [ ] Bản đồ có chú giải, attribution OSM; pin phân biệt được cả khi không nhìn màu
- [ ] Thao tác được bằng bàn phím: form, bảng, dialog, lightbox, tab, bộ lọc
- [ ] Các cặp màu chữ/nền đạt tương phản AA
- [ ] Thử ở 360 / 768 / 1024 / 1440px
- [ ] Ảnh và font có nguồn và quyền sử dụng, ghi trong README