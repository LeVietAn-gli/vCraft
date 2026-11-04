# 02 — Kiến trúc hệ thống (Architecture)

## 1. Tech stack

**Chốt:** dùng **JavaScript (ES modules)** cho cả frontend và backend, với React + Vite, Express, PostgreSQL và Prisma.

| Phần | Lựa chọn | Lý do | Cần giải thích được khi vấn đáp |
|------|----------|-------|---------------------------------|
| Ngôn ngữ | JavaScript (ES modules) | Một ngôn ngữ cho cả giao diện và server | Module, Promise, async/await, xử lý lỗi |
| Giao diện | React + Vite | Chia giao diện thành component để tái sử dụng và chia việc | Component, props, state, `useEffect`; JSX không phải HTML thuần |
| Định tuyến | React Router | Tách rõ trang public, Buyer, Artisan, Admin | Route phía client khác với quyền truy cập API; refresh URL con |
| Styling | CSS thuần / CSS Modules | Tự thiết kế, dễ giải thích; đúng yêu cầu "không dùng thư viện có sẵn" | Cascade, Flexbox, Grid, media query, biến CSS |
| Gọi API | `fetch` + JSON | Tải và cập nhật từng phần, không reload trang | HTTP method, status code, `credentials`, trạng thái loading/lỗi |
| Backend | Node.js + Express | Giữ JavaScript xuyên suốt; tổ chức theo module | Route → middleware → controller → service → repository |
| CSDL | PostgreSQL | Dữ liệu quan hệ, ràng buộc, transaction | Khóa ngoại, unique, index, transaction, chống tạo đơn trùng |
| ORM | Prisma | Schema, migration và truy vấn rõ ràng | ORM không thay thế việc hiểu SQL; phải đọc lại migration |
| Đăng nhập | Session + cookie HttpOnly | Server quản lý phiên và quyền; JS phía client không đọc được cookie | Session store bền vững, hết hạn, CSRF |
| Validate | Zod (server) | Kiểm tra kiểu dữ liệu và quy tắc đầu vào tại một chỗ | Validation HTML chỉ hỗ trợ UX; server luôn kiểm tra lại |
| Ảnh | Multer + Sharp | Nhận multipart, kiểm tra và tối ưu ảnh | Loại tệp thật, dung lượng, lưu bền vững (không lưu ở thư mục tạm) |
| Bản đồ | Leaflet + OpenStreetMap | Miễn phí, không cần API key | Bắt buộc ghi nguồn bản đồ (attribution) |
| QR | Thư viện QR (ví dụ `qrcode`) | Sinh QR chứa URL truy xuất public | QR chỉ mở dữ liệu, không tự xác thực hàng thật |

**Thư viện phụ trợ (đề xuất, nhóm tự chốt):**

| Mục đích | Gợi ý |
|----------|-------|
| Session | `express-session` + store PostgreSQL (ví dụ `connect-pg-simple`) |
| Băm mật khẩu | `bcrypt` |
| Giới hạn đăng nhập | `express-rate-limit` |
| Bản đồ trong React | `react-leaflet` (hoặc gọi Leaflet trực tiếp trong `useEffect`) |
| Mã lô, slug | `nanoid`, hàm slugify tự viết (bỏ dấu tiếng Việt) |
| State người dùng hiện tại | React Context (`AuthContext`), không cần thư viện state riêng |

## 2. Sơ đồ tổng thể

```mermaid
flowchart LR
    subgraph Client
        B[Trình duyệt<br/>React SPA]
        P[Điện thoại quét QR]
    end

    subgraph Server[Node.js + Express]
        MW[Middleware:<br/>session · requireAuth · requireRole · validate · csrf]
        R[Routes → Controllers → Services]
        REPO[Repositories<br/>Prisma Client]
        IMG[Upload: Multer + Sharp]
        QR[QR service]
    end

    DB[(PostgreSQL<br/>dữ liệu + session)]
    FS[(UPLOAD_DIR<br/>ảnh bền vững)]
    OSM[OpenStreetMap tiles]

    B -- "fetch /api/* (cookie phiên)" --> MW --> R --> REPO --> DB
    P -- "APP_PUBLIC_URL/truy-xuat/:maLo" --> B
    R --> IMG --> FS
    B -- "/uploads/*" --> FS
    B -- tile --> OSM
```

**Cùng origin:** trình duyệt chỉ làm việc với **một địa chỉ**, nên cookie phiên hoạt động mà không phải cấu hình CORS.
- **Dev:** Vite proxy chuyển `/api` và `/uploads` sang Express.
- **Demo/production:** Express phục vụ luôn bản build của frontend (`frontend/dist`). Mọi route không bắt đầu bằng `/api` hoặc `/uploads` đều trả về `index.html` để React Router xử lý, nhờ vậy refresh đường dẫn sâu không bị 404.

> Cú pháp route wildcard khác nhau giữa Express 4 và Express 5. Hãy viết route fallback theo đúng phiên bản Express đang dùng.

## 3. Cấu trúc repository

```
vcraft/
├── backend/
├── frontend/
├── docs/
├── docker-compose.yml     # PostgreSQL cho dev
├── .env.example
└── README.md              # cài đặt, migrate, seed, chạy, tài khoản mẫu (N1-T6-02)
```

### 3.1. Backend (Express)

```
backend/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.js
├── uploads/                    # .gitignore; nằm trong UPLOAD_DIR
└── src/
    ├── server.js               # listen
    ├── app.js                  # gắn middleware, routes, error handler
    ├── config/env.js           # đọc và kiểm tra biến môi trường
    ├── lib/prisma.js           # một PrismaClient dùng chung
    ├── middlewares/
    │   ├── requireAuth.js
    │   ├── requireRole.js
    │   ├── validate.js         # nhận Zod schema cho body/query/params
    │   ├── csrf.js
    │   ├── upload.js           # cấu hình Multer
    │   └── errorHandler.js
    ├── utils/                  # AppError, slugify, pagination
    └── modules/
        ├── auth/               # N1
        ├── rfq/                # N1: RFQ nháp, gửi, danh sách của Buyer
        ├── orders/             # N1: duyệt phương án → tạo đơn + nhiệm vụ, nhận hàng
        ├── workshops/          # N2: hồ sơ, chứng nhận, bản đồ, gợi ý
        ├── products/           # N2: CRUD, catalog
        ├── media/              # N2: upload và tối ưu ảnh (dùng chung)
        ├── batches/            # N2: lô, mốc nhật ký, QR
        ├── trace/              # N2: API truy xuất public
        ├── tasks/              # N2: nhiệm vụ sản xuất, tiến độ
        ├── invitations/        # N3: matching và lời mời
        ├── bids/               # N3: báo giá
        ├── plans/              # N3: phương án chia đơn
        ├── news/               # N3
        └── admin/              # N3: duyệt xưởng, dashboard, đơn toàn làng
```

Mỗi module gồm:

```
x.routes.js        # khai báo URL + middleware
x.controller.js    # đọc req, gọi service, trả res (không chứa nghiệp vụ)
x.service.js       # nghiệp vụ, kiểm tra quyền sở hữu, transaction
x.repository.js    # truy vấn Prisma (chỉ lớp này import prisma)
x.schema.js        # Zod schema
```

### 3.2. Frontend (React + Vite)

```
frontend/src/
├── main.jsx
├── App.jsx                     # khai báo route
├── api/
│   ├── client.js               # apiFetch: JSON, credentials, chuẩn hóa lỗi, xử lý 401
│   └── *.api.js                # hàm gọi API theo module
├── context/AuthContext.jsx     # người dùng hiện tại (GET /api/auth/me)
├── components/                 # component tự viết: Button, Card, Dialog, Gallery, Timeline...
├── layouts/                    # PublicLayout, BuyerLayout, ArtisanLayout, AdminLayout
├── pages/                      # mỗi route một page
├── features/                   # logic + component theo nghiệp vụ
├── hooks/                      # useFetch, useQueryParams...
├── utils/                      # format tiền/ngày
└── styles/
    ├── tokens.css              # biến CSS: màu, font, spacing, radius, shadow
    ├── global.css              # reset, typography, layout chung
    └── (các file *.module.css đặt cạnh component)
```

## 4. Định tuyến

### 4.1. Route frontend

| URL | Trang | Quyền |
|-----|-------|-------|
| `/` | Trang chủ triển lãm số | Public |
| `/kham-pha` | Catalog sản phẩm (lọc bằng query string) | Public |
| `/san-pham/:slug` | Chi tiết sản phẩm | Public |
| `/xuong/:slug` | Hồ sơ xưởng / nghệ nhân | Public |
| `/lang-nghe` | Bản đồ làng nghề | Public |
| `/truy-xuat/:maLo` | Trang truy xuất nguồn gốc của lô | Public |
| `/tin-tuc` | Tin cộng đồng *(đề xuất)* | Public |
| `/dang-nhap`, `/dang-ky` | Xác thực | Khách |
| `/buyer/...` | RFQ, báo giá, phương án, đơn hàng *(đề xuất)* | BUYER |
| `/nghe-nhan/...` | Hồ sơ, sản phẩm, lô, lời mời, nhiệm vụ *(đề xuất)* | ARTISAN |
| `/quan-tri/...` | Duyệt xưởng, chia đơn, đơn toàn làng, tin tức *(đề xuất)* | ADMIN |

> Chặn route ở frontend chỉ nhằm cải thiện trải nghiệm. **Quyền thật luôn được kiểm tra ở API.**

### 4.2. API

- Prefix `/api`, đặt tên tài nguyên bằng tiếng Anh, số nhiều. Ví dụ: `/api/rfqs/:id/bids`, `/api/plans/:id/accept`, `/api/trace/:batchCode`.
- Hành động chuyển trạng thái dùng `POST` tới một sub-resource: `POST /api/rfqs/:id/send`, `POST /api/plans/:id/reject`, `POST /api/orders/:id/confirm-received`.

## 5. Xác thực, phiên và phân quyền

**Phiên làm việc:**
1. `POST /api/auth/login` → kiểm tra mật khẩu → `req.session.regenerate()` để chống session fixation → lưu `{ userId, role }` vào session.
2. Session được lưu trong **PostgreSQL**, nên khởi động lại server không làm mất phiên.
3. Cookie có các thuộc tính `httpOnly: true`, `sameSite: 'lax'`, `secure` chỉ bật khi chạy HTTPS, `maxAge` (ví dụ 1 ngày).
4. `POST /api/auth/logout` → `req.session.destroy()` và xóa cookie.
5. `GET /api/auth/me` → frontend gọi khi tải trang để khôi phục người dùng hiện tại.

**CSRF:** `sameSite: 'lax'` đã chặn phần lớn request giả mạo từ site khác. Thêm một lớp: với mọi request `POST/PUT/PATCH/DELETE`, kiểm tra header `Origin` trùng với `APP_PUBLIC_URL`, hoặc dùng token double-submit. Không dùng `csurf` vì thư viện này đã bị deprecated.

**Phân quyền ở 3 lớp:**

| Lớp | Cơ chế |
|-----|--------|
| Đăng nhập | `requireAuth` trả 401 nếu chưa có session |
| Vai trò | `requireRole('ADMIN')` trả 403 nếu sai vai trò |
| Chủ sở hữu | Trong service: lọc truy vấn theo `buyerId` / `workshopId` của người đang đăng nhập. Không tin ID gửi từ client |
| Trạng thái xưởng | Artisan có xưởng chưa `APPROVED` không dùng được chức năng xưởng (403) |

**Hết phiên ở frontend:** `apiFetch` nhận 401 → chuyển tới `/dang-nhap?next=<đường dẫn hiện tại>`. Sau khi đăng nhập, chỉ chuyển tới `next` nếu đó là đường dẫn nội bộ (bắt đầu bằng `/`), để tránh open redirect và vòng lặp điều hướng.

## 6. Các luồng kỹ thuật chính

### 6.1. Upload và tối ưu ảnh

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant M as Multer (memoryStorage)
    participant S as Media service (Sharp)
    participant FS as UPLOAD_DIR
    participant DB as PostgreSQL

    FE->>M: POST /api/media (multipart, nhiều file)
    M->>M: giới hạn số file, dung lượng
    loop mỗi ảnh
        M->>S: buffer
        S->>S: sharp(buffer).metadata() → xác định loại ảnh thật
        S->>S: rotate() theo EXIF, resize thumb/medium/large → WebP
        S->>FS: ghi file (tên = id ngẫu nhiên, không dùng tên gốc)
        S->>DB: INSERT media_files
    end
    S-->>FE: [{ id, variants }]
```

| Biến thể | Chiều rộng tối đa | Dùng ở |
|----------|-------------------|--------|
| `thumb` | 400px | Grid catalog, popup bản đồ |
| `medium` | 1000px | Chi tiết sản phẩm, timeline |
| `large` | 1920px | Xem phóng to |

- **Kiểm tra loại tệp thật:** không tin `mimetype` hay đuôi file. Nếu Sharp không đọc được metadata hoặc định dạng không nằm trong danh sách cho phép thì trả 400.
- Dùng `withoutEnlargement: true` để không phóng to ảnh nhỏ.
- **Lưu bền vững:** `UPLOAD_DIR` là thư mục cố định nằm ngoài thư mục tạm. Ảnh phải còn sau khi khởi động lại.
- **Xóa ảnh thừa:** khi thay hoặc xóa ảnh của sản phẩm, mốc nhật ký hay xưởng thì xóa cả bản ghi lẫn file. Ảnh đã upload nhưng không được gắn vào đâu có thể dọn theo thời gian.
- Frontend: `<img loading="lazy">`, có `width` và `height`, dùng `srcset` với 3 biến thể.

### 6.2. Lô sản xuất, QR và truy xuất

1. Artisan tạo lô gồm danh sách `{ productId, quantity }`. Server sinh `batchCode` duy nhất (`maLo`), là mã ngắn, ngẫu nhiên và không lộ ID nội bộ.
2. URL trong QR: `${APP_PUBLIC_URL}/truy-xuat/${batchCode}`. Mọi sản phẩm trong lô dùng chung URL này.
3. `GET /api/batches/:id/qr?format=png|svg` → sinh ảnh QR để tải về hoặc in.
4. `GET /api/trace/:batchCode` (public) trả lô, xưởng, các sản phẩm của lô, các mốc nhật ký (theo thứ tự) và ảnh. **Không** trả dữ liệu nội bộ.
5. Mã sai trả **404**. Lô chưa công khai cũng trả **404**, để người ngoài không biết lô đó tồn tại. Mốc thiếu ảnh hoặc thiếu ngày được hiển thị đúng như dữ liệu, không tự điền.

> `APP_PUBLIC_URL` phải là địa chỉ mà **điện thoại quét QR truy cập được** (ví dụ IP LAN của máy chạy demo hoặc URL deploy), **không** được là `localhost`. QR in ra mã hóa URL tại thời điểm sinh, nên phải chốt giá trị này trước khi in.

### 6.3. Bản đồ làng nghề

- Leaflet với tile OpenStreetMap, kèm attribution `© OpenStreetMap contributors` (bắt buộc).
- `GET /api/workshops/map` trả danh sách rút gọn của các xưởng đã duyệt: `slug, name, lat, lng, thumb, acceptsVisitors, visitingHours`.
- Pin dùng icon SVG tự thiết kế, **hai màu** phân biệt xưởng nhận và không nhận khách; có chú giải và bộ lọc "Nhận khách tham quan".
- Form hồ sơ xưởng: click lên bản đồ để chọn vị trí, rồi lưu `lat/lng`.

### 6.4. RFQ → phương án → đơn hàng

Tóm tắt; chi tiết state machine và các ca lỗi ở `04-quotation-flow.md`.

```mermaid
flowchart LR
    A[Buyer gửi RFQ] -->|transaction: matching + tạo Invitation| B[Xưởng chào giá]
    B --> C[Admin lập phương án<br/>server kiểm tra tổng + tính tiền]
    C -->|gửi, khóa sửa| D{Buyer}
    D -->|từ chối| C
    D -->|chấp nhận: transaction| E[Tạo Order + ProductionTask<br/>khóa báo giá/phương án]
    E --> F[Xưởng sản xuất, bàn giao]
    F --> G[Buyer xác nhận nhận hàng]
```

Nguyên tắc dùng Prisma cho các bước quan trọng:
- Dùng **interactive transaction** `prisma.$transaction(async (tx) => { ... })`.
- Chuyển trạng thái bằng **update có điều kiện**, ví dụ `tx.allocationPlan.updateMany({ where: { id, status: 'PENDING_BUYER' }, data: { status: 'ACCEPTED' } })`. Nếu `count !== 1` thì ném lỗi 409, cả transaction bị rollback.
- Lớp chặn cuối cùng: ràng buộc **UNIQUE** ở CSDL (một đơn cho mỗi RFQ). Lỗi Prisma `P2002` được chuyển thành 409.
- Tổng tiền **luôn tính ở server** từ đơn giá và số lượng lưu trong CSDL, không nhận từ frontend.

## 7. Quy ước styling

- **Không** dùng thư viện UI hay CSS framework (Bootstrap, Tailwind, MUI, Ant Design...).
- Design token đặt ở `styles/tokens.css` dưới dạng biến CSS. Màu lấy cảm hứng từ nghề đã chọn, ví dụ với gốm: men lam, đất nung, men rạn. Kèm typography, spacing, radius, shadow.
- Style riêng của component viết bằng **CSS Modules** (`Card.module.css`). Vite hỗ trợ sẵn, không cần cài thêm.
- Layout dùng Grid/Flexbox; viết mobile-first với `min-width` media query.
- Hiệu ứng (hover ảnh, timeline, chuyển trạng thái) viết bằng `transition` / `@keyframes`, tôn trọng `prefers-reduced-motion`.

## 8. Quy ước API và lỗi

*(Chốt chính thức tại N1-T1-03; dưới đây là đề xuất.)*

- Request và response đều là JSON. Danh sách nhận `?page=&limit=&sort=&q=` và trả về:
  ```json
  { "data": [...], "meta": { "page": 1, "limit": 20, "total": 134 } }
  ```
- Lỗi luôn có dạng:
  ```json
  { "error": { "code": "PLAN_NOT_PENDING", "message": "Phương án không còn chờ duyệt", "details": null } }
  ```
- Lỗi validate Zod trả `400`, kèm `details` là danh sách lỗi theo từng trường.
- Mã trạng thái: `400` dữ liệu sai · `401` chưa đăng nhập · `403` sai quyền hoặc xưởng chưa duyệt · `404` không tìm thấy (hoặc không có quyền xem) · `409` xung đột trạng thái hoặc trùng · `413` file quá lớn · `429` đăng nhập sai quá nhiều lần.
- `errorHandler` là nơi duy nhất trả lỗi. Controller ném `AppError(status, code, message)`.
- Frontend không được báo thành công khi request lỗi, và không được nuốt lỗi mạng (N1-T5-06).

## 9. Môi trường và chạy demo

**`.env` backend:**

| Biến | Ví dụ |
|------|-------|
| `PORT` | `3000` |
| `DATABASE_URL` | `postgresql://vcraft:vcraft@localhost:5432/vcraft` |
| `SESSION_SECRET` | *(chuỗi ngẫu nhiên, không commit)* |
| `SESSION_MAX_AGE_MS` | `86400000` |
| `APP_PUBLIC_URL` | `http://192.168.1.10:3000` (URL mà điện thoại truy cập được) |
| `UPLOAD_DIR` | `./uploads` |
| `MAX_UPLOAD_MB` | `5` |

**`.env` frontend:** `VITE_VILLAGE_LAT`, `VITE_VILLAGE_LNG` (tâm bản đồ).

**Chạy:**
1. `docker compose up -d` (PostgreSQL)
2. `backend`: `npx prisma migrate deploy` → `npx prisma db seed` → `npm run dev`
3. `frontend`: `npm run dev` (có proxy `/api`)
4. Khi demo QR trên điện thoại: `npm run build` ở frontend, rồi chạy Express phục vụ bản build trên IP LAN.

**Bí mật:** chỉ commit `.env.example`; `.env` và `uploads/` nằm trong `.gitignore` (N3-T1-08).