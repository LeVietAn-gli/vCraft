# 🏺 vCraft — Nền tảng kết nối làng nghề Bát Tràng

vCraft là dự án website triển lãm, giới thiệu sản phẩm thủ công và kết nối các bên tham gia hoạt động sản xuất, đặt hàng tại làng nghề gốm Bát Tràng.

Hệ thống hướng tới ba nhóm người dùng chính:

- **Buyer (Khách hàng):** Khám phá sản phẩm, tạo yêu cầu báo giá (RFQ), xem và duyệt phương án phân chia đơn hàng, theo dõi tiến độ và xác nhận nhận hàng.
- **Artisan (Nghệ nhân/Xưởng sản xuất):** Quản lý xưởng, sản phẩm, báo giá, nhiệm vụ sản xuất và thông tin truy xuất nguồn gốc.
- **Admin (Ban quản lý):** Quản lý hệ thống, xét duyệt xưởng, điều phối báo giá và lập phương án phân chia đơn hàng.

> **Lưu ý về trạng thái dự án:** Phiên bản hiện tại tập trung triển khai module Buyer. Các giao diện và API nghiệp vụ của Artisan/Admin chưa được triển khai đầy đủ. Một số API đọc dữ liệu và dữ liệu mẫu được cung cấp để hỗ trợ phát triển, trình diễn và kiểm thử Buyer.

---

## 📑 Mục lục

1. [Công nghệ sử dụng](#1-công-nghệ-sử-dụng)
2. [Yêu cầu hệ thống](#2-yêu-cầu-hệ-thống)
3. [Clone dự án từ GitHub](#3-clone-dự-án-từ-github)
4. [Cài đặt môi trường](#4-cài-đặt-môi-trường)
5. [Khởi tạo cơ sở dữ liệu](#5-khởi-tạo-cơ-sở-dữ-liệu)
6. [Khởi chạy ứng dụng](#6-khởi-chạy-ứng-dụng)
7. [Tài khoản demo](#7-tài-khoản-demo)
8. [Hướng dẫn sử dụng](#8-hướng-dẫn-sử-dụng)
9. [Kiểm thử dự án](#9-kiểm-thử-dự-án)
10. [Cấu trúc thư mục](#10-cấu-trúc-thư-mục)
11. [Các lệnh thường dùng](#11-các-lệnh-thường-dùng)
12. [Xử lý lỗi thường gặp](#12-xử-lý-lỗi-thường-gặp)
13. [Cập nhật mã nguồn từ GitHub](#13-cập-nhật-mã-nguồn-từ-github)
14. [Quy trình làm việc nhóm](#14-quy-trình-làm-việc-nhóm)
15. [Bảo mật và lưu ý](#15-bảo-mật-và-lưu-ý)
16. [Tài liệu tham khảo nội bộ](#16-tài-liệu-tham-khảo-nội-bộ)

---

## 1. Công nghệ sử dụng

### Frontend

| Công nghệ      | Vai trò                              |
| -------------- | ------------------------------------ |
| React 18       | Xây dựng giao diện                   |
| Vite 6         | Development server và build frontend |
| React Router 6 | Điều hướng các trang                 |
| Leaflet        | Hiển thị bản đồ                      |
| CSS            | Thiết kế và tùy chỉnh giao diện      |

### Backend

| Công nghệ       | Vai trò                        |
| --------------- | ------------------------------ |
| Node.js         | Môi trường thực thi JavaScript |
| Express 4       | Xây dựng REST API              |
| Prisma 6        | ORM thao tác cơ sở dữ liệu     |
| PostgreSQL 16   | Lưu trữ dữ liệu                |
| Express Session | Quản lý phiên đăng nhập        |
| bcryptjs        | Băm mật khẩu                   |
| Zod             | Kiểm tra dữ liệu đầu vào       |

### Công cụ phát triển

- Git và GitHub
- npm Workspaces
- Docker Desktop và Docker Compose
- Prisma CLI
- Visual Studio Code (khuyến nghị)

---

## 2. Yêu cầu hệ thống

Trước khi cài đặt dự án, cần chuẩn bị những công cụ sau.

### 2.1. Node.js và npm

Khuyến nghị sử dụng:

- Node.js 20 trở lên, ưu tiên bản LTS.
- npm tương thích với phiên bản Node.js đang sử dụng.

Tải Node.js tại:

https://nodejs.org/

Sau khi cài đặt, mở PowerShell hoặc Terminal và kiểm tra:

```bash
node -v
npm -v
```

Nếu hai lệnh hiển thị số phiên bản thì Node.js và npm đã sẵn sàng.

### 2.2. Git

Tải Git tại:

https://git-scm.com/downloads

Kiểm tra:

```bash
git --version
```

### 2.3. Docker Desktop

Dự án sử dụng PostgreSQL 16 thông qua Docker Compose.

Tải Docker Desktop tại:

https://www.docker.com/products/docker-desktop/

Sau khi cài đặt:

1. Khởi động Docker Desktop.
2. Đảm bảo Docker Engine đã chạy.
3. Mở Terminal và kiểm tra:

```bash
docker --version
docker compose version
```

> Nếu sử dụng Windows, Docker Desktop có thể yêu cầu bật WSL2 và tính năng ảo hóa của hệ thống.

### 2.4. Trình duyệt

Khuyến nghị:

- Google Chrome
- Microsoft Edge
- Mozilla Firefox

Sử dụng phiên bản trình duyệt tương đối mới để đảm bảo tương thích với ứng dụng.

---

## 3. Clone dự án từ GitHub

### Bước 1: Mở Terminal

Ví dụ trên Windows, mở PowerShell tại thư mục muốn lưu dự án:

```powershell
cd D:\Projects
```

Có thể sử dụng thư mục khác tùy ý.

### Bước 2: Clone repository

```bash
git clone <REPOSITORY_URL>
```

Thay `<REPOSITORY_URL>` bằng URL HTTPS hoặc SSH thực tế của repository trên GitHub.

Ví dụ về cấu trúc URL:

```text
https://github.com/<OWNER>/<REPOSITORY>.git
```

Sau khi clone, di chuyển vào thư mục dự án:

```bash
cd vcraft
```

Nếu clone với tên thư mục khác, hãy sử dụng tên thư mục tương ứng.

### Bước 3: Kiểm tra mã nguồn

Thư mục gốc dự án cần có những thành phần chính:

```text
vcraft/
├── backend/
├── frontend/
├── docs/
├── topics/
├── docker-compose.yml
├── package.json
└── README.md
```

Nếu không thấy `package.json` hoặc `docker-compose.yml`, hãy kiểm tra lại repository và nhánh Git đang sử dụng.

---

## 4. Cài đặt môi trường

### 4.1. Cài đặt dependencies

Tại thư mục gốc dự án:

```bash
npm install
```

Dự án sử dụng npm Workspaces, vì vậy chỉ cần chạy `npm install` tại thư mục gốc để cài dependencies cho cả frontend và backend.

Không cần chạy `npm install` riêng trong từng thư mục.

Sau khi hoàn tất, npm sẽ thông báo số package được cài đặt và kết quả kiểm tra dependency.

> Nếu npm thông báo có lỗ hổng bảo mật, không nên tự động chạy `npm audit fix --force`. Hãy xem chi tiết bằng `npm audit` trước khi quyết định nâng cấp các package.

### 4.2. Tạo file cấu hình môi trường

Dự án cung cấp sẵn hai file cấu hình mẫu:

```text
backend/.env.example
frontend/.env.example
```

Cần sao chép chúng thành các file `.env` để ứng dụng sử dụng.

**Windows PowerShell:**

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

**Linux/macOS:**

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Sau bước này, cấu trúc sẽ có:

```text
backend/
├── .env
└── .env.example

frontend/
├── .env
└── .env.example
```

**Quan trọng:** File `.env` chứa thông tin cấu hình môi trường và không được commit lên GitHub.

### 4.3. Cấu hình backend

Mở file:

```text
backend/.env
```

Nội dung tham khảo:

```dotenv
NODE_ENV=development

PORT=4000

DATABASE_URL=postgresql://vcraft:vcraft_dev_only@localhost:5432/vcraft?schema=public

SESSION_SECRET=THAY_BANG_CHUOI_BI_MAT_NGAU_NHIEN

APP_PUBLIC_URL=http://localhost:5173

TRUST_PROXY=false
```

Giải thích:

| Biến             | Ý nghĩa                                  |
| ---------------- | ---------------------------------------- |
| `NODE_ENV`       | Môi trường chạy ứng dụng                 |
| `PORT`           | Cổng backend                             |
| `DATABASE_URL`   | Chuỗi kết nối PostgreSQL                 |
| `SESSION_SECRET` | Khóa bí mật để ký cookie phiên đăng nhập |
| `APP_PUBLIC_URL` | Địa chỉ công khai của frontend           |
| `TRUST_PROXY`    | Có tin cậy reverse proxy hay không       |

**Bắt buộc thay `SESSION_SECRET` bằng chuỗi ngẫu nhiên dài tối thiểu 32 ký tự.**

Có thể tạo bằng lệnh:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Copy kết quả và dán vào `SESSION_SECRET`.

Không sử dụng lại khóa bí mật của người khác.

### 4.4. Cấu hình frontend

Mở file:

```text
frontend/.env
```

Nội dung mặc định:

```dotenv
VITE_API_PROXY_TARGET=http://localhost:4000

VITE_MAP_LAT=20.9797
VITE_MAP_LNG=105.9116
```

Giải thích:

| Biến                    | Ý nghĩa                                       |
| ----------------------- | --------------------------------------------- |
| `VITE_API_PROXY_TARGET` | Backend nhận các request `/api` khi chạy Vite |
| `VITE_MAP_LAT`          | Vĩ độ trung tâm bản đồ                        |
| `VITE_MAP_LNG`          | Kinh độ trung tâm bản đồ                      |

Thông thường không cần chỉnh sửa các biến này khi chạy dự án trên máy cá nhân.

### 4.5. Kiểm tra cấu hình PostgreSQL

File `docker-compose.yml` hiện sử dụng:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: vcraft
      POSTGRES_USER: vcraft
      POSTGRES_PASSWORD: vcraft_dev_only
    ports:
      - "5432:5432"
    volumes:
      - vcraft_db:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vcraft -d vcraft"]
      interval: 5s
      timeout: 3s
      retries: 10

volumes:
  vcraft_db:
```

Theo cấu hình này:

| Thuộc tính    | Giá trị           |
| ------------- | ----------------- |
| Database      | `vcraft`          |
| Username      | `vcraft`          |
| Password demo | `vcraft_dev_only` |
| Host          | `localhost`       |
| Port          | `5432`            |
| PostgreSQL    | 16                |

Thông tin trong `DATABASE_URL` phải khớp với cấu hình PostgreSQL.

> Các giá trị trên chỉ phục vụ môi trường phát triển local. Không sử dụng mật khẩu demo này khi triển khai hệ thống thực tế.

---

## 5. Khởi tạo cơ sở dữ liệu

### 5.1. Khởi động PostgreSQL

Đảm bảo Docker Desktop đang chạy.

Tại thư mục gốc:

```bash
docker compose up -d
```

Lệnh này tạo hoặc khởi động PostgreSQL theo cấu hình `docker-compose.yml`.

Kiểm tra:

```bash
docker compose ps
```

Khi PostgreSQL sẵn sàng, container sẽ hiển thị trạng thái đang chạy, đồng thời healthcheck sẽ chuyển sang `healthy`.

Nếu muốn xem log:

```bash
docker compose logs postgres
```

### 5.2. Tạo Prisma Client

Chạy:

```bash
npm run db:generate --workspace backend
```

Lệnh này sử dụng Prisma schema để sinh Prisma Client cho backend.

Nếu thành công, Prisma sẽ thông báo quá trình generate đã hoàn tất.

### 5.3. Kiểm tra Prisma schema

Có thể kiểm tra schema bằng:

```bash
npx prisma validate --schema backend/prisma/schema.prisma
```

Schema hợp lệ là điều kiện cần trước khi đồng bộ cơ sở dữ liệu.

### 5.4. Tạo bảng trong PostgreSQL

Chạy:

```bash
npm run db:push --workspace backend
```

Lệnh này đồng bộ các model trong:

```text
backend/prisma/schema.prisma
```

với PostgreSQL.

**Lưu ý:** `db:push` được sử dụng cho môi trường phát triển local của phiên bản hiện tại.

Không nên dùng `db:push` tùy tiện trên cơ sở dữ liệu production. Khi nhóm hoàn thiện migration, cần áp dụng quy trình migration chính thức.

### 5.5. Áp dụng ràng buộc bổ sung

Chạy:

```bash
npm run db:constraints --workspace backend
```

Lệnh này thực thi các ràng buộc SQL bổ sung trong:

```text
backend/prisma/EXTRA_CONSTRAINTS.sql
```

Đây là bước cần thiết để đảm bảo các ràng buộc dữ liệu không được biểu diễn đầy đủ bằng Prisma schema.

### 5.6. Thêm dữ liệu mẫu

Chạy:

```bash
npm run db:seed --workspace backend
```

Dữ liệu seed hiện tại bao gồm:

- 3 tài khoản Buyer.
- 6 xưởng được duyệt.
- 30 sản phẩm minh họa.
- 6 yêu cầu báo giá (RFQ).
- Báo giá và phương án chia đơn mẫu.
- Đơn hàng ở các trạng thái khác nhau.
- Dữ liệu lô sản xuất và truy xuất nguồn gốc.
- Một số thông báo minh họa.

Khi seed thành công, terminal sẽ hiển thị thông báo tương tự:

```text
Seed ready: 3 Buyers, 6 approved workshops, 30 products, 6 RFQs
```

> Chỉ chạy seed demo trên cơ sở dữ liệu phát triển hoặc kiểm thử. Không chạy trên cơ sở dữ liệu production có dữ liệu thật.

### 5.7. Tổng hợp các lệnh khởi tạo database

Chạy lần lượt:

```bash
docker compose up -d

npm run db:generate --workspace backend

npx prisma validate --schema backend/prisma/schema.prisma

npm run db:push --workspace backend

npm run db:constraints --workspace backend

npm run db:seed --workspace backend
```

Sau khi hoàn tất, có thể khởi chạy ứng dụng.

---

## 6. Khởi chạy ứng dụng

### 6.1. Chạy frontend và backend cùng lúc

Tại thư mục gốc:

```bash
npm run dev
```

Script này sử dụng `concurrently` để khởi động cả backend và frontend.

Các dịch vụ mặc định:

| Dịch vụ            | Địa chỉ                          |
| ------------------ | -------------------------------- |
| Frontend           | http://localhost:5173            |
| Backend            | http://localhost:4000            |
| Backend Health API | http://localhost:4000/api/health |

Mở trình duyệt tại:

http://localhost:5173

Nếu frontend khởi động trên một cổng khác vì `5173` đang được sử dụng, cần kiểm tra lại cấu hình `APP_PUBLIC_URL`, vì backend yêu cầu Origin của các request thay đổi dữ liệu phải khớp chính xác với biến này.

### 6.2. Kiểm tra backend

Truy cập:

http://localhost:4000/api/health

Nếu backend hoạt động, kết quả mong đợi:

```json
{
  "data": {
    "status": "ok"
  }
}
```

Lưu ý: Endpoint health hiện chỉ xác nhận API đang phản hồi, không kiểm tra toàn bộ các thao tác đọc/ghi PostgreSQL.

### 6.3. Chạy riêng từng dịch vụ

Nếu muốn quan sát log độc lập, mở hai Terminal.

**Terminal 1 — Backend:**

```bash
npm run dev --workspace backend
```

**Terminal 2 — Frontend:**

```bash
npm run dev --workspace frontend
```

Frontend sẽ gửi các request `/api` đến backend thông qua proxy của Vite.

### 6.4. Dừng ứng dụng

Trong Terminal đang chạy `npm run dev`, nhấn:

```text
Ctrl + C
```

Để dừng PostgreSQL:

```bash
docker compose down
```

Lệnh này không xóa volume chứa dữ liệu PostgreSQL.

Lần sau chỉ cần khởi động lại:

```bash
docker compose up -d
npm run dev
```

Nếu database đã khởi tạo trước đó thì không cần seed lại mỗi lần chạy.

### 6.5. Build frontend

Chạy:

```bash
npm run build
```

Sau khi build thành công, tài nguyên frontend sẽ được tạo tại:

```text
frontend/dist/
```

Có thể chạy backend ở chế độ phục vụ frontend đã build:

```bash
npm run start --workspace backend
```

Khi đó, backend phục vụ cả API và các file frontend đã build qua cổng backend.

Đây là cách kiểm tra bản build local, chưa phải hướng dẫn triển khai production hoàn chỉnh.

---

## 7. Tài khoản demo

Sau khi chạy seed, có thể đăng nhập bằng những tài khoản Buyer sau.

| Vai trò | Email                | Mật khẩu     |
| ------- | -------------------- | ------------ |
| Buyer 1 | `buyer1@vcraft.demo` | `Demo@2026!` |
| Buyer 2 | `buyer2@vcraft.demo` | `Demo@2026!` |
| Buyer 3 | `buyer3@vcraft.demo` | `Demo@2026!` |

Các tài khoản này chỉ dành cho phát triển và kiểm thử local.

### 7.1. Buyer 1

```text
Email: buyer1@vcraft.demo
Password: Demo@2026!
```

Tài khoản này có dữ liệu minh họa để kiểm thử:

- RFQ đang nháp.
- RFQ đã gửi.
- RFQ có báo giá và phương án chờ Buyer duyệt.
- Đơn hàng đang trong quá trình sản xuất.

### 7.2. Buyer 2

```text
Email: buyer2@vcraft.demo
Password: Demo@2026!
```

Tài khoản này có đơn hàng mẫu ở trạng thái `READY`, phục vụ kiểm thử chức năng xác nhận nhận hàng.

### 7.3. Buyer 3

```text
Email: buyer3@vcraft.demo
Password: Demo@2026!
```

Tài khoản này có đơn hàng minh họa đã hoàn tất giao nhận.

> Không sử dụng tài khoản và mật khẩu demo trên môi trường công khai. Phần giao diện Admin/Artisan chưa đầy đủ dù seed có thể tạo các tài khoản thuộc những vai trò đó.

---

## 8. Hướng dẫn sử dụng

### 8.1. Các trang chính

| Chức năng           | URL                    |
| ------------------- | ---------------------- |
| Trang chủ           | `/`                    |
| Đăng nhập           | `/dang-nhap`           |
| Đăng ký             | `/dang-ky`             |
| Khám phá sản phẩm   | `/kham-pha`            |
| Bản đồ làng nghề    | `/lang-nghe`           |
| Danh sách RFQ Buyer | `/buyer/rfqs`          |
| Tạo RFQ mới         | `/buyer/rfqs/moi`      |
| Danh sách đơn hàng  | `/buyer/don-hang`      |
| Tin tức             | `/tin-tuc`             |
| Truy xuất mẫu       | `/truy-xuat/BT-DEMO-1` |

Ví dụ:

http://localhost:5173/buyer/rfqs

Các trang Buyer yêu cầu người dùng đăng nhập bằng tài khoản có vai trò `BUYER`.

### 8.2. Tạo yêu cầu báo giá (RFQ)

1. Đăng nhập tài khoản Buyer.
2. Mở trang danh sách RFQ.
3. Chọn tạo yêu cầu mới.
4. Nhập thông tin sản phẩm cần đặt.
5. Chọn danh mục.
6. Nhập số lượng, ngân sách và thông tin giao hàng.
7. Chọn hạn nhận báo giá và ngày cần hàng.
8. Lưu bản nháp.
9. Kiểm tra dữ liệu trước khi gửi.
10. Gửi RFQ.

Sau khi RFQ được gửi thành công, hệ thống thực hiện logic tìm các xưởng phù hợp theo dữ liệu hiện có.

### 8.3. Xem báo giá và phương án

Buyer có thể:

- Xem các báo giá đã có.
- Xem phương án phân chia đơn hàng.
- Kiểm tra số lượng giao cho từng xưởng.
- Kiểm tra đơn giá và tổng tiền.
- Chấp nhận hoặc từ chối phương án.

Việc chấp nhận phương án được xử lý ở backend bằng transaction nhằm tránh tạo đơn hàng trùng khi có nhiều request đồng thời.

### 8.4. Theo dõi đơn hàng

Sau khi Buyer chấp nhận phương án hợp lệ, hệ thống tạo đơn hàng và các nhiệm vụ sản xuất tương ứng.

Buyer có thể truy cập:

http://localhost:5173/buyer/don-hang

Tại đây có thể:

- Xem danh sách đơn hàng.
- Xem thông tin chi tiết.
- Xem trạng thái.
- Theo dõi tiến độ dựa trên sản lượng.
- Xác nhận đã nhận hàng khi đơn đủ điều kiện.

### 8.5. Truy xuất nguồn gốc

Có thể mở trang truy xuất mẫu:

http://localhost:5173/truy-xuat/BT-DEMO-1

Trang này hiển thị các thông tin truy xuất được công khai của lô sản xuất trong dữ liệu demo.

Đây là dữ liệu minh họa, không phải chứng nhận nguồn gốc hàng hóa thực tế.

---

## 9. Kiểm thử dự án

### 9.1. Kiểm tra cú pháp backend

```bash
npm run check
```

### 9.2. Chạy unit test

```bash
npm test
```

Các bài test hiện có tập trung vào:

- Xử lý số tiền.
- Kiểm tra tổng số lượng chia đơn.
- Kiểm tra phương án không hợp lệ.
- Tính tiến độ theo sản lượng.
- Kiểm tra chuyển hướng đăng nhập.
- Kiểm tra slug và mã.
- Kiểm tra hạn báo giá và ngày giao hàng.

### 9.3. Kiểm tra build

```bash
npm run build
```

Nếu frontend build thành công, Vite sẽ tạo các file production trong `frontend/dist`.

### 9.4. Kiểm thử tích hợp Buyer

**Cảnh báo: Bài kiểm thử này thay đổi dữ liệu trong database.**

Chỉ thực hiện trên cơ sở dữ liệu thử nghiệm mới seed và đang chạy backend.

```bash
node backend/tests/integration/buyer-smoke.mjs
```

Bài kiểm thử xác minh một số nghiệp vụ quan trọng:

- Đăng nhập và đăng xuất.
- Cách ly dữ liệu giữa các Buyer.
- Chặn Buyer truy cập RFQ của người khác.
- Chặn Buyer chấp nhận phương án của người khác.
- Xử lý hai request chấp nhận phương án đồng thời.
- Kiểm tra tránh tạo đơn hàng trùng.
- Kiểm tra số lượng ProductionTask.
- Xác nhận nhận hàng đúng người sở hữu.
- Không cho xác nhận nhận hàng lặp lại.

**Nên chạy smoke test trước khi thao tác chấp nhận phương án DEMO3 hoặc xác nhận đơn READY thủ công.**

Script sử dụng dữ liệu demo cụ thể và không được thiết kế để chạy lặp trên một database đã bị thay đổi bởi lần kiểm thử trước.

Nếu muốn chạy lại, cần dùng một database thử nghiệm mới, sạch, sau đó khởi tạo schema, constraints và seed lại.

Không chạy script này trên database dùng chung có dữ liệu cần giữ.

### 9.5. Kiểm thử thủ công

Các tình huống nên kiểm thử:

1. Đăng nhập đúng và sai mật khẩu.
2. Đăng xuất rồi truy cập trang Buyer.
3. Buyer tạo RFQ nháp.
4. Buyer sửa RFQ.
5. Buyer gửi RFQ với dữ liệu hợp lệ.
6. Gửi RFQ không có xưởng phù hợp.
7. Gửi lại RFQ đã gửi.
8. Buyer xem báo giá và phương án.
9. Buyer chấp nhận phương án.
10. Buyer từ chối phương án.
11. Buyer xem đơn hàng của mình.
12. Buyer không đọc được đơn của người khác.
13. Buyer xác nhận nhận hàng đúng trạng thái.
14. Truy cập mã truy xuất không tồn tại.
15. Kiểm tra giao diện trên điện thoại.

Chi tiết xem:

```text
docs/BUYER_DEMO.md
docs/BUYER_QA_RESULT.md
```

---

## 10. Cấu trúc thư mục

```text
vcraft/
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── EXTRA_CONSTRAINTS.sql
│   │
│   ├── scripts/
│   │   ├── apply-constraints.js
│   │   └── check-syntax.js
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── domain/
│   │   ├── integration/
│   │   ├── lib/
│   │   ├── middlewares/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── rfq/
│   │   │   └── orders/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── tests/
│   │   └── integration/
│   │
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   ├── brand/
│   │   └── items/
│   │
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── .env.example
│   ├── vite.config.js
│   └── package.json
│
├── docs/
│   ├── 01-requirements.md
│   ├── 02-architecture.md
│   ├── 03-database.md
│   ├── 04-quotation_flow.md
│   ├── 05-api.md
│   ├── 06-ui_design.md
│   ├── 07-setup.md
│   ├── 08-team_workflow.md
│   ├── BUYER_DEMO.md
│   ├── BUYER_IMPLEMENTATION.md
│   └── BUYER_QA_RESULT.md
│
├── topics/
│   ├── vCraft.docx
│   └── vCraft_Ke_hoach_3_nguoi_6_tuan.xlsx
│
├── docker-compose.yml
├── package.json
└── README.md
```

### Mô tả các thư mục chính

| Thư mục                      | Mục đích                               |
| ---------------------------- | -------------------------------------- |
| `backend/src/modules/auth`   | Xác thực và tài khoản                  |
| `backend/src/modules/rfq`    | Nghiệp vụ RFQ                          |
| `backend/src/modules/orders` | Phương án và đơn hàng                  |
| `backend/src/integration`    | API đọc phục vụ tích hợp tạm thời      |
| `backend/src/middlewares`    | Xác thực, phân quyền, kiểm tra request |
| `backend/prisma`             | Schema và dữ liệu mẫu                  |
| `frontend/src/pages`         | Các trang giao diện                    |
| `frontend/src/api`           | Gọi backend API                        |
| `frontend/src/context`       | Quản lý trạng thái xác thực            |
| `frontend/src/styles`        | CSS và design tokens                   |
| `docs`                       | Tài liệu phát triển                    |
| `topics`                     | Đề bài và bảng kế hoạch gốc            |

---

## 11. Các lệnh thường dùng

Tất cả các lệnh sau chạy tại thư mục gốc của dự án, trừ khi có ghi chú khác.

### Development

| Lệnh                               | Chức năng                |
| ---------------------------------- | ------------------------ |
| `npm install`                      | Cài đặt dependencies     |
| `npm run dev`                      | Chạy frontend và backend |
| `npm run dev --workspace frontend` | Chạy riêng frontend      |
| `npm run dev --workspace backend`  | Chạy riêng backend       |
| `npm run build`                    | Build frontend           |
| `npm run check`                    | Kiểm tra cú pháp backend |
| `npm test`                         | Chạy unit test           |

### Database

| Lệnh                                         | Chức năng                |
| -------------------------------------------- | ------------------------ |
| `docker compose up -d`                       | Khởi động PostgreSQL     |
| `docker compose ps`                          | Xem trạng thái container |
| `docker compose down`                        | Dừng các container       |
| `npm run db:generate --workspace backend`    | Sinh Prisma Client       |
| `npm run db:push --workspace backend`        | Đồng bộ schema local     |
| `npm run db:constraints --workspace backend` | Áp dụng SQL constraints  |
| `npm run db:seed --workspace backend`        | Thêm dữ liệu demo        |

### Xem dữ liệu bằng Prisma Studio

Chạy:

```bash
npx prisma studio --schema backend/prisma/schema.prisma
```

Prisma Studio cho phép xem và chỉnh sửa các bản ghi trong database thông qua giao diện web.

Chỉ nên sử dụng để kiểm tra cơ sở dữ liệu local.

---

## 12. Xử lý lỗi thường gặp

### 12.1. Lỗi `npm` hoặc `node` không được nhận diện

Ví dụ:

```text
npm is not recognized
```

Nguyên nhân thường gặp:

- Chưa cài Node.js.
- Node.js chưa được thêm vào PATH.
- Terminal chưa được mở lại sau khi cài đặt.

Cách xử lý:

1. Cài Node.js từ website chính thức.
2. Đóng và mở lại Terminal.
3. Kiểm tra `node -v` và `npm -v`.

### 12.2. Không kết nối được Docker

Ví dụ:

```text
Cannot connect to the Docker daemon
```

Cách xử lý:

1. Mở Docker Desktop.
2. Đảm bảo Docker Engine đang chạy.
3. Kiểm tra:

```bash
docker info
```

4. Khởi động lại PostgreSQL:

```bash
docker compose up -d
```

### 12.3. Cổng PostgreSQL 5432 đã được sử dụng

Nếu máy đang chạy một PostgreSQL khác, Docker có thể báo lỗi không bind được cổng `5432`.

Có thể xử lý bằng cách dừng dịch vụ đang chiếm cổng hoặc thay đổi cổng được publish trong `docker-compose.yml`.

Ví dụ:

```yaml
ports:
  - "5433:5432"
```

Khi đó, cập nhật `DATABASE_URL` trong `backend/.env`:

```dotenv
DATABASE_URL=postgresql://vcraft:vcraft_dev_only@localhost:5433/vcraft?schema=public
```

Sau khi chỉnh sửa, khởi động lại container.

### 12.4. Prisma báo lỗi `P1001`

Ví dụ:

```text
Can't reach database server
```

Kiểm tra:

```bash
docker compose ps
```

Và:

```bash
docker compose logs postgres
```

Đảm bảo:

- Container PostgreSQL đang chạy.
- Cổng trong `DATABASE_URL` chính xác.
- Username, password và database đúng.
- Không có dịch vụ khác chiếm cổng.

Sau khi sửa lỗi:

```bash
npm run db:generate --workspace backend
npm run db:push --workspace backend
```

### 12.5. Prisma báo lỗi xác thực `P1000`

Kiểm tra username và password trong:

```text
backend/.env
```

Chúng phải khớp với tài khoản đã được khởi tạo trong PostgreSQL.

**Lưu ý:** Thay đổi `POSTGRES_PASSWORD` trong Docker Compose không tự động thay đổi mật khẩu của PostgreSQL đã có dữ liệu trong volume cũ.

Nếu đây là database local hoàn toàn mới, có thể khởi tạo lại theo hướng dẫn ở mục 12.10.

### 12.6. Prisma Client chưa được sinh

Nếu gặp lỗi liên quan đến:

```text
@prisma/client
```

Thử:

```bash
npm run db:generate --workspace backend
```

Nếu npm thông báo các install scripts bị chặn, kiểm tra danh sách bằng:

```bash
npm approve-scripts --allow-scripts-pending
```

Chỉ cho phép những install scripts của package đã được xác minh, ví dụ Prisma và esbuild được dự án sử dụng.

Sau đó chạy lại quá trình generate/build nếu cần.

### 12.7. Frontend mở được nhưng không tải dữ liệu

Kiểm tra lần lượt:

**1. Backend có đang chạy không?**

Mở:

http://localhost:4000/api/health

**2. PostgreSQL có hoạt động không?**

```bash
docker compose ps
```

**3. Database đã được khởi tạo chưa?**

```bash
npm run db:push --workspace backend
npm run db:constraints --workspace backend
npm run db:seed --workspace backend
```

**4. Frontend proxy có đúng không?**

Kiểm tra file:

```text
frontend/.env
```

Biến:

```dotenv
VITE_API_PROXY_TARGET=http://localhost:4000
```

Sau khi thay đổi cấu hình, khởi động lại development server.

### 12.8. Không đăng nhập được

Kiểm tra:

1. Đã chạy seed chưa?
2. Email và mật khẩu có chính xác không?
3. Backend có đang chạy không?
4. Trình duyệt có cho phép cookie không?
5. `APP_PUBLIC_URL` có khớp với địa chỉ frontend không?

Trong môi trường local mặc định, nên sử dụng thống nhất:

```text
http://localhost:5173
```

Không trộn lẫn `localhost` và `127.0.0.1` khi kiểm tra session/Origin nếu chưa điều chỉnh cấu hình tương ứng.

### 12.9. Lỗi `403 CSRF_REJECTED`

Backend kiểm tra Origin đối với các request thay đổi dữ liệu.

Kiểm tra biến:

```dotenv
APP_PUBLIC_URL=http://localhost:5173
```

Đảm bảo trình duyệt đang truy cập đúng Origin này.

Nếu Vite chuyển sang cổng khác, cần sửa cấu hình cho khớp rồi khởi động lại backend.

### 12.10. Khởi tạo lại database từ đầu

**CẢNH BÁO: Các lệnh dưới đây xóa dữ liệu PostgreSQL trong volume Docker Compose của dự án.**

Chỉ sử dụng khi chắc chắn đây là database local có thể xóa và không chứa dữ liệu cần giữ.

Dừng ứng dụng và chạy:

```bash
docker compose down -v
```

Tạo lại PostgreSQL:

```bash
docker compose up -d
```

Khởi tạo lại schema:

```bash
npm run db:generate --workspace backend
npm run db:push --workspace backend
npm run db:constraints --workspace backend
npm run db:seed --workspace backend
```

Sau đó:

```bash
npm run dev
```

Không chạy `docker compose down -v` trên máy hoặc hệ thống có dữ liệu cần bảo toàn nếu chưa sao lưu.

### 12.11. Giao diện không hiển thị sau khi build

Kiểm tra:

```bash
npm run build
```

Nếu build lỗi, đọc thông báo lỗi trong Terminal.

Nếu đã build nhưng muốn chạy frontend bằng Vite, sử dụng:

```bash
npm run dev --workspace frontend
```

Nếu muốn backend phục vụ frontend đã build:

```bash
npm run start --workspace backend
```

### 12.12. npm phát hiện lỗ hổng bảo mật

Kiểm tra:

```bash
npm audit
```

Có thể xem các dependency đang lỗi thời bằng:

```bash
npm outdated
```

Chỉ cập nhật package sau khi kiểm tra tương thích và chạy lại test/build.

Không chạy `npm audit fix --force` một cách tự động vì thao tác này có thể đưa vào các bản nâng cấp không tương thích.

---

## 13. Cập nhật mã nguồn từ GitHub

Khi các thành viên khác đã cập nhật repository, cần lấy mã nguồn mới.

### 13.1. Kiểm tra nhánh hiện tại

```bash
git branch --show-current
```

### 13.2. Kiểm tra các thay đổi local

```bash
git status
```

Nếu có thay đổi chưa commit, nên commit hoặc stash trước khi chuyển nhánh/pull.

### 13.3. Lấy phiên bản mới nhất

Ví dụ cập nhật nhánh `main`:

```bash
git switch main
git pull origin main
```

Chỉ sử dụng `main` nếu đây là nhánh chính mà nhóm thống nhất.

### 13.4. Cập nhật dependencies

Nếu `package.json` hoặc lockfile thay đổi:

```bash
npm install
```

### 13.5. Cập nhật database

Nếu có thay đổi trong Prisma schema:

```bash
npm run db:generate --workspace backend
npm run db:push --workspace backend
npm run db:constraints --workspace backend
```

Các lệnh trên phục vụ môi trường local hiện tại.

Khi nhóm chuyển sang quy trình Prisma Migrate chính thức, cần làm theo tài liệu migration mới, thay vì tự ý chạy `db:push`.

### 13.6. Khởi chạy lại

```bash
docker compose up -d
npm run dev
```

---

## 14. Quy trình làm việc nhóm

Dự án được phân chia cho ba thành viên.

| Thành viên | Vai trò | Phần phụ trách                                                           |
| ---------- | ------- | ------------------------------------------------------------------------ |
| N1         | Buyer   | Tài khoản, đăng nhập, RFQ, duyệt phương án, đơn hàng, xác nhận nhận hàng |
| N2         | Artisan | Xưởng, sản phẩm, upload, lô sản xuất, truy xuất, tiến độ                 |
| N3         | Admin   | Duyệt xưởng, lời mời, báo giá, phương án chia đơn, quản trị              |

Các module nghiệp vụ cần được tích hợp dựa trên API contract và database schema thống nhất.

### 14.1. Quy tắc làm việc với Git

Không phát triển trực tiếp trên nhánh `main` nếu nhóm đang sử dụng quy trình Pull Request.

Tạo nhánh tính năng:

```bash
git switch main
git pull origin main
git switch -c feat/ten-chuc-nang
```

Sau khi hoàn thành:

```bash
git add .
git commit -m "feat: mo ta chuc nang"
git push -u origin feat/ten-chuc-nang
```

Mở Pull Request trên GitHub để thành viên khác review trước khi merge.

### 14.2. Quy ước commit

Sử dụng Conventional Commits:

```text
feat: thêm chức năng mới
fix: sửa lỗi
docs: cập nhật tài liệu
refactor: tái cấu trúc mã nguồn
test: bổ sung kiểm thử
chore: cập nhật cấu hình hoặc công cụ
```

Ví dụ:

```bash
git commit -m "feat(rfq): add buyer RFQ creation"
```

### 14.3. Trước khi tạo Pull Request

Nên chạy:

```bash
npm run check
npm test
npm run build
```

Ngoài ra cần tự kiểm tra các chức năng bị ảnh hưởng trên ứng dụng đang chạy.

Nếu PR thay đổi database, cần ghi rõ cách cập nhật schema/migration và tác động tới dữ liệu hiện có.

### 14.4. Lưu ý khi tích hợp module

Phiên bản hiện tại có các router đọc dữ liệu tạm tại:

```text
backend/src/integration/
```

Khi module Artisan/Admin hoàn thiện, cần:

- Thay thế các endpoint tạm bằng API do thành viên tương ứng triển khai.
- Đảm bảo không trùng route.
- Thống nhất các trạng thái RFQ, Order và ProductionTask.
- Kiểm tra phân quyền ở backend.
- Kiểm tra các transaction quan trọng.
- Cập nhật tài liệu API.
- Kiểm thử lại toàn bộ luồng Buyer → Artisan → Admin.

---

## 15. Bảo mật và lưu ý

### 15.1. Không commit thông tin bí mật

Không đưa lên GitHub:

```text
.env
.env.*
node_modules/
frontend/dist/
backend/uploads/
```

Riêng các file `.env.example` cần được giữ trong repository để người khác có thể cấu hình môi trường.

Đảm bảo `.gitignore` có các quy tắc tương ứng.

Nếu vô tình commit mật khẩu hoặc secret thật, cần thay thế secret đó và loại bỏ thông tin khỏi lịch sử Git theo quy trình phù hợp.

### 15.2. Mật khẩu demo

Các tài khoản có mật khẩu `Demo@2026!` chỉ phục vụ môi trường thử nghiệm local.

Không triển khai public với các tài khoản demo này.

### 15.3. Session và cookie

Backend sử dụng session lưu phía server và cookie HttpOnly.

Các request thay đổi dữ liệu được kiểm tra Origin.

Việc bảo vệ dữ liệu Buyer phải được thực hiện phía backend, không chỉ dựa vào giao diện.

### 15.4. Database

Không dùng database phát triển chung với database production.

Không chạy seed demo trên dữ liệu thật.

Không xóa Docker volume nếu chưa sao lưu dữ liệu cần giữ.

### 15.5. Triển khai production

README này ưu tiên **cài đặt môi trường phát triển local**.

Nếu triển khai lên server công khai, cần chuẩn bị thêm:

- HTTPS và domain.
- Reverse proxy thích hợp.
- Session secret an toàn.
- PostgreSQL có cấu hình bảo mật.
- Quản lý biến môi trường.
- Migration chính thức.
- Cơ chế backup và restore.
- Quản lý tài khoản và phân quyền.
- Kiểm thử bảo mật.
- Theo dõi log và xử lý sự cố.

Không nên xem cấu hình Docker Compose local trong tài liệu này là cấu hình production.

---

## 16. Tài liệu tham khảo nội bộ

Các tài liệu kỹ thuật nằm trong thư mục `docs/`.

| Tài liệu                  | Nội dung                       |
| ------------------------- | ------------------------------ |
| `01-requirements.md`      | Đặc tả yêu cầu                 |
| `02-architecture.md`      | Kiến trúc hệ thống             |
| `03-database.md`          | Thiết kế cơ sở dữ liệu         |
| `04-quotation_flow.md`    | Luồng báo giá và phân chia đơn |
| `05-api.md`               | Hợp đồng API                   |
| `06-ui_design.md`         | Thiết kế giao diện             |
| `07-setup.md`             | Hướng dẫn setup bổ sung        |
| `08-team_workflow.md`     | Quy trình làm việc nhóm        |
| `BUYER_DEMO.md`           | Kịch bản demo Buyer            |
| `BUYER_IMPLEMENTATION.md` | Đối chiếu công việc Buyer      |
| `BUYER_QA_RESULT.md`      | Báo cáo kiểm thử Buyer         |

Đề bài và bảng phân chia công việc gốc nằm tại:

```text
topics/vCraft.docx
topics/vCraft_Ke_hoach_3_nguoi_6_tuan.xlsx
```

---

## 🚀 Quick Start — Cài đặt nhanh trên Windows

Dành cho người đã cài đặt đầy đủ:

- Node.js và npm
- Git
- Docker Desktop

### Bước 1: Clone

```powershell
git clone <REPOSITORY_URL>
cd vcraft
```

### Bước 2: Cấu hình

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

Sinh secret:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Mở `backend\.env` và thay `SESSION_SECRET` bằng kết quả vừa tạo.

### Bước 3: Cài đặt

```powershell
npm install
```

### Bước 4: Khởi động database

```powershell
docker compose up -d
docker compose ps
```

Đảm bảo PostgreSQL đã healthy trước khi tiếp tục.

### Bước 5: Khởi tạo dữ liệu

```powershell
npm run db:generate --workspace backend
npx prisma validate --schema backend/prisma/schema.prisma
npm run db:push --workspace backend
npm run db:constraints --workspace backend
npm run db:seed --workspace backend
```

### Bước 6: Chạy ứng dụng

```powershell
npm run dev
```

### Bước 7: Truy cập

**Website:**

http://localhost:5173

**API:**

http://localhost:4000/api/health

**Tài khoản Buyer demo:**

```text
Email: buyer1@vcraft.demo
Password: Demo@2026!
```

### Bước 8: Kiểm thử

Mở Terminal khác tại thư mục gốc:

```powershell
npm run check
npm test
npm run build
```

Nếu cả ba lệnh thành công, có thể tiếp tục kiểm thử các nghiệp vụ bằng trình duyệt.

---

## ✅ Hoàn tất

Sau khi thực hiện đầy đủ các bước trên, người phát triển có thể:

- Chạy PostgreSQL bằng Docker.
- Khởi động frontend React và backend Express.
- Đăng nhập bằng tài khoản Buyer demo.
- Tạo và quản lý RFQ.
- Kiểm tra báo giá, phương án và đơn hàng mẫu.
- Xem catalog, bản đồ và trang truy xuất nguồn gốc.
- Chạy unit test và build frontend.

**Lưu ý cuối cùng:** Để nghiệm thu toàn bộ quy trình nghiệp vụ ba vai trò, cần hoàn thiện và tích hợp thêm các module Artisan/Admin, sau đó chạy kiểm thử end-to-end trên database thật.

---

**vCraft — Kết nối tinh hoa làng nghề Việt.**
