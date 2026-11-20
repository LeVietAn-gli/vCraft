# 07 — Cài đặt và chạy dự án (Setup)

Hướng dẫn chi tiết để **một người chưa từng chạy dự án** có thể khởi động được frontend, backend và PostgreSQL, rồi migrate, seed và thử QR trên điện thoại (N3-T6-04). README ở thư mục gốc chỉ tóm tắt các lệnh chính và link tới file này (N1-T6-02).

---

## 1. Yêu cầu môi trường

| Công cụ | Ghi chú |
|---------|---------|
| **Node.js** (bản LTS) + npm | Cả nhóm dùng **cùng một bản major**. Ghi bản đó vào `.nvmrc` và `"engines"` trong `package.json` |
| **Docker Desktop** | Để chạy PostgreSQL. Không có Docker thì cài PostgreSQL trực tiếp và sửa `DATABASE_URL` cho phù hợp |
| **Git** | |
| Trình duyệt | Chrome hoặc Firefox bản mới |

> Không ghi số phiên bản cụ thể trong tài liệu này. Bản thật được khóa trong `package.json`, `package-lock.json` và `docker-compose.yml`. Khi nâng phiên bản, cập nhật các file đó chứ không cập nhật tài liệu.

## 2. Chạy lần đầu

```bash
# 1. Lấy source
git clone <repo-url> vcraft && cd vcraft

# 2. Tạo file môi trường từ mẫu
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
#    → mở backend/.env, đặt SESSION_SECRET thành một chuỗi ngẫu nhiên

# 3. Khởi động PostgreSQL
docker compose up -d

# 4. Backend
cd backend
npm install
npx prisma migrate dev        # tạo bảng theo các migration có sẵn + sinh Prisma Client
npx prisma db seed            # nạp dữ liệu demo (mục 5)
npm run dev                   # http://localhost:3000

# 5. Frontend (mở terminal khác)
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

Mở `http://localhost:5173` và đăng nhập bằng một trong các tài khoản mẫu ở mục 5.3.

## 3. File cấu hình

### 3.1. `docker-compose.yml`

```yaml
services:
  db:
    image: postgres:16          # ví dụ; nhóm chốt một tag và giữ nguyên
    container_name: vcraft-db
    environment:
      POSTGRES_USER: vcraft
      POSTGRES_PASSWORD: vcraft
      POSTGRES_DB: vcraft
    ports:
      - "5432:5432"
    volumes:
      - vcraft-pgdata:/var/lib/postgresql/data   # dữ liệu còn sau khi tắt container
volumes:
  vcraft-pgdata:
```

### 3.2. `backend/.env.example`

```dotenv
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://vcraft:vcraft@localhost:5432/vcraft

# Phiên đăng nhập
SESSION_SECRET=change-me-to-a-long-random-string
SESSION_MAX_AGE_MS=86400000

# URL mà trình duyệt / điện thoại dùng để mở web. Dùng để sinh QR và kiểm tra Origin (CSRF)
APP_PUBLIC_URL=http://localhost:5173

# Ảnh
UPLOAD_DIR=./uploads
MAX_UPLOAD_MB=5

# Giới hạn đăng nhập sai
LOGIN_MAX_ATTEMPTS=5
LOGIN_WINDOW_MS=900000
```

`config/env.js` kiểm tra các biến này bằng Zod ngay khi server khởi động. Nếu thiếu hoặc sai, server dừng lại và in rõ biến nào có vấn đề.

### 3.3. `frontend/.env.example`

```dotenv
# Tâm bản đồ làng nghề (ví dụ: khu vực Bát Tràng; nhóm tự đo lại tọa độ)
VITE_VILLAGE_LAT=21.0050
VITE_VILLAGE_LNG=105.9140
VITE_VILLAGE_ZOOM=16
```

### 3.4. Vite proxy (`frontend/vite.config.js`)

Proxy giúp frontend và API **cùng origin** khi dev, nên cookie phiên hoạt động mà không cần cấu hình CORS:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    },
  },
});
```

### 3.5. Scripts gợi ý

```jsonc
// backend/package.json
{
  "type": "module",
  "scripts": {
    "dev": "node --watch src/server.js",     // nếu bản Node chưa hỗ trợ --watch thì dùng nodemon
    "start": "node src/server.js",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:reset": "prisma migrate reset",
    "db:seed": "prisma db seed",
    "seed:perf": "node prisma/seed-perf.js",
    "studio": "prisma studio"
  }
}
```

**Khai báo lệnh seed:** với các bản Prisma cũ, khai báo bằng khóa `"prisma": { "seed": "node prisma/seed.js" }` trong `package.json`. Các bản mới chuyển cấu hình sang file `prisma.config.*`. **Kiểm tra tài liệu Prisma đúng với phiên bản nhóm cài** trước khi làm.

## 4. Làm việc với CSDL và migration

| Việc | Lệnh | Ghi chú |
|------|------|---------|
| Tạo migration sau khi sửa `schema.prisma` | `npx prisma migrate dev --name add_workshop_category` | Đặt tên ngắn, snake_case, mô tả đúng thay đổi |
| Tạo migration có SQL viết tay (CHECK, partial index) | `npx prisma migrate dev --create-only --name ...` → sửa file `migration.sql` → `npx prisma migrate dev` | Xem `03-database.md`. Tên bảng và cột phải đặt trong nháy kép |
| Áp dụng migration mới sau khi pull code | `npx prisma migrate dev` | |
| Xóa sạch CSDL, tạo lại, seed lại | `npx prisma migrate reset` | Mất toàn bộ dữ liệu local |
| Chạy khi demo | `npx prisma migrate deploy` | Chỉ áp dụng migration, không tạo mới |
| Xem dữ liệu | `npx prisma studio` | |

**Quy tắc:**
- **Không sửa** một migration đã được merge vào `main`. Muốn thay đổi thì tạo migration mới.
- **Không dùng** `prisma db push` trên CSDL chung.
- Commit cả thư mục `prisma/migrations/`.
- Pull `main` **trước khi** tạo migration, để thứ tự migration không bị lệch (chi tiết ở `08-team-workflow.md`).

## 5. Dữ liệu seed

### 5.1. Thứ tự seed

`Category` → `User` (Admin, Buyer, Artisan) → `Workshop` + `WorkshopCategory` + ảnh + chứng nhận → `Product` + `ProductImage` → `ProductionBatch` + `BatchProduct` + `ProductionMilestone` + `MilestoneImage` → `News` → `Rfq` → `RfqInvitation` → `Bid` → `AllocationPlan` + item → `Order` + `ProductionTask`.

Mỗi thành viên viết phần seed cho các bảng mình phụ trách, trong các file `prisma/seed/n1.js`, `n2.js`, `n3.js`. File `seed.js` gọi lần lượt từng file theo thứ tự trên.

### 5.2. Ảnh seed

- Ảnh gốc đặt trong `backend/prisma/seed-assets/` (đã commit; ảnh có nguồn hoặc được phép dùng, nguồn ghi trong `seed-assets/SOURCES.md`).
- Seed **chạy ảnh qua đúng pipeline Sharp** của ứng dụng, để sinh `imageUrl` và `thumbUrl` vào `UPLOAD_DIR`, giống như khi người dùng upload thật.
- `migrate reset` xóa CSDL nhưng không xóa file ảnh. Vì vậy script seed nên dọn `UPLOAD_DIR` trước khi chạy.

### 5.3. Tài khoản mẫu

Mật khẩu chung của tài khoản mẫu được ghi trong README, không ghi trong tài liệu này. Đây chỉ là dữ liệu demo local.

| Vai trò | Email | Trạng thái |
|---------|-------|------------|
| Admin | `admin@vcraft.local` | |
| Buyer | `buyer1@vcraft.local` … `buyer3@vcraft.local` | |
| Artisan (đã duyệt) | `xuong1@vcraft.local` … `xuong8@vcraft.local` | `APPROVED` |
| Artisan (chờ duyệt) | `cho-duyet1@vcraft.local`, `cho-duyet2@vcraft.local` | `PENDING` |

Số lượng dữ liệu của từng loại theo bảng ở `03-database.md`, mục 7.

### 5.4. Seed thử hiệu năng

`npm run seed:perf` thêm ≥ 200 sản phẩm có ảnh (N2-T5-06). Script này chạy riêng, không nằm trong bộ seed demo, để dữ liệu khi demo vẫn gọn.

## 6. Chạy demo và quét QR trên điện thoại

Điện thoại không truy cập được `localhost` của laptop. Vì vậy khi demo, chạy ở chế độ **một server phục vụ cả frontend và API**, trên địa chỉ IP trong mạng LAN:

```bash
# 1. Tìm IP LAN của laptop
#    Windows: ipconfig        → IPv4 Address, ví dụ 192.168.1.10
#    macOS:   ipconfig getifaddr en0
#    Linux:   hostname -I

# 2. Đặt URL công khai TRƯỚC khi sinh hoặc in QR
#    backend/.env → APP_PUBLIC_URL=http://192.168.1.10:3000

# 3. Build frontend
cd frontend && npm run build          # sinh frontend/dist

# 4. Chạy backend ở chế độ phục vụ bản build (Express trả frontend/dist + fallback index.html)
cd ../backend && NODE_ENV=production npm start
#    Server phải listen trên 0.0.0.0 để máy khác trong mạng truy cập được
```

Mở `http://192.168.1.10:3000` trên laptop và trên điện thoại (cùng mạng Wi-Fi), rồi thử quét QR.

**Lưu ý:**
- **Wi-Fi của trường hoặc quán cà phê thường chặn các thiết bị nhìn thấy nhau** (client isolation). Cách chắc chắn nhất là phát **hotspot từ điện thoại** cho laptop kết nối vào.
- Cho phép cổng 3000 qua firewall của máy (Windows sẽ hỏi lần đầu chạy Node).
- Chạy qua HTTP thì cookie **không được bật** cờ `secure`; chỉ bật cờ này khi có HTTPS.
- QR mã hóa URL tại thời điểm sinh, nên đổi IP thì phải tải lại QR. Nếu cần một URL cố định (để in nhãn trước), hãy deploy lên cloud. Việc deploy là tùy chọn (N3-T4-07).
- Thử toàn bộ quy trình này **ít nhất một lần trước buổi vấn đáp**, trên chính laptop và mạng sẽ dùng (N1-T5-08, N2-T5-07).

## 7. Sao lưu và khôi phục dữ liệu demo (N3-T4-07)

```bash
# Sao lưu CSDL
docker exec vcraft-db pg_dump -U vcraft -d vcraft -Fc > backup/vcraft.dump

# Khôi phục CSDL
docker exec -i vcraft-db pg_restore -U vcraft -d vcraft --clean --if-exists < backup/vcraft.dump

# Sao lưu ảnh (bắt buộc đi kèm bản sao lưu CSDL, vì CSDL chỉ lưu đường dẫn)
#   nén thư mục backend/uploads cùng thời điểm với file .dump
```

Trước buổi demo, chuẩn bị sẵn một bộ `vcraft.dump` + `uploads.zip` ở trạng thái "đẹp". Nếu có sự cố, khôi phục mất khoảng một phút, thay vì phải seed lại từ đầu.

## 8. Xử lý sự cố thường gặp

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|-------------|------------------------|------------|
| `P1001: Can't reach database server` | Container PostgreSQL chưa chạy | `docker compose up -d`; kiểm tra `DATABASE_URL` |
| `port 5432 is already allocated` | Máy đã cài PostgreSQL khác | Tắt PostgreSQL đó, hoặc đổi cổng thành `"5433:5432"` và sửa `DATABASE_URL` |
| Prisma báo **drift** và đòi reset | Ai đó sửa CSDL bằng tay, hoặc session store tự tạo bảng | Ở local: `npx prisma migrate reset`. Bảng `session` phải được khai báo trong schema |
| Lỗi cài đặt `sharp` | Sharp dùng binary riêng cho từng hệ điều hành | Xóa `node_modules`, chạy lại `npm install` trên chính máy đó; không commit `node_modules` |
| Refresh `/xuong/abc` bị 404 | Ở chế độ build, thiếu route fallback trả `index.html` | Xem `02-architecture.md`, mục 2 (cú pháp wildcard khác nhau giữa Express 4 và 5) |
| Đăng nhập xong nhưng `/api/auth/me` vẫn trả 401 | Gọi API khác origin (không qua proxy); hoặc bật cờ `secure` khi chạy HTTP | Gọi qua `/api` cùng origin; chỉ bật `secure` khi có HTTPS |
| Mọi request `POST` bị 403 `CSRF_REJECTED` | `APP_PUBLIC_URL` không trùng với địa chỉ đang mở trên trình duyệt | Sửa `APP_PUBLIC_URL` cho đúng (dev: `http://localhost:5173`) |
| Quét QR mở ra `localhost` | QR được sinh khi `APP_PUBLIC_URL` vẫn là localhost | Sửa biến môi trường, khởi động lại server, tải lại QR |
| Ảnh biến mất sau khi khởi động lại | `UPLOAD_DIR` trỏ vào thư mục tạm, hoặc thư mục bị xóa | Đặt `UPLOAD_DIR` là thư mục cố định; sao lưu theo mục 7 |
| Bản đồ trống, không có tile | Máy không có Internet (tile OSM tải từ mạng) | Bản đồ cần Internet. Chuẩn bị hotspot khi demo |