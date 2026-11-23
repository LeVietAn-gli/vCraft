# vCraft

Triển lãm số gốm Bát Tràng. Bản này triển khai phần nền tảng tuần 1 của Người 2 và có dữ liệu demo để chạy riêng từ bản repo nhóm đã cung cấp.

- [Tài liệu chung của nhóm](docs/README.md)
- [Bàn giao N2 tuần 1, bài thực hành và điểm ghép](docs/N2-Tuan-1.md)

## Chạy demo local

Cần Node.js 24 LTS, npm và Docker Compose. Chạy ở thư mục chứa file này. Có thể dùng WSL trên Windows hoặc Bash trên macOS/Linux.

```bash
npm ci
cp backend/.env.example backend/.env
docker compose up -d --wait db
npm run db:generate
npm run db:migrate
npm run seed
npm run dev
```

Trước khi chạy `npm run dev`, mở `backend/.env` và điền `VCRAFT_DEMO_PASSWORD` với mật khẩu demo do bạn đặt (12–128 ký tự) và `SESSION_SECRET` với chuỗi ngẫu nhiên dài ít nhất 32 ký tự. Có thể tạo secret bằng `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Dùng một database riêng để demo. Nếu cổng 5432 bị chiếm, đổi cổng host trong Compose và cập nhật `DATABASE_URL`.

Mở [http://localhost:5173](http://localhost:5173). Chọn **Hồ sơ xưởng → Đăng nhập**, rồi dùng `xuong1@vcraft.local` (đã duyệt) hoặc `cho-duyet1@vcraft.local` (chờ duyệt) cùng mật khẩu đã đặt. Đổi tài khoản bằng cửa sổ riêng tư mới. Trình đăng nhập local chỉ áp dụng cho tài khoản seed được đánh dấu demo. Kết nối session chính thức theo điểm ghép trong tài liệu bàn giao.

- Hồ sơ công khai `/xuong/men-lam`
- Hồ sơ đang chờ duyệt `/xuong/lua-am` (API công khai trả 404)
- Truy xuất lô mẫu `/truy-xuat/BT-DEMO-01`

## Kiểm thử

```bash
npm run lint
npm run format:check
npm run build

docker compose exec -T db createdb -U vcraft vcraft_test
export VCRAFT_TEST_DATABASE_URL=postgresql://vcraft:vcraft@127.0.0.1:5432/vcraft_test
DATABASE_URL="$VCRAFT_TEST_DATABASE_URL" npm run db:migrate
npm test
```

`npm test` cần database test riêng đã áp migration để chạy bộ kiểm thử tích hợp. Để xem bản build do Express phục vụ, đặt `APP_PUBLIC_URL=http://localhost:3000` trong `backend/.env`, rồi chạy `npm run build` và `npm start`. Dữ liệu PostgreSQL và thư mục ảnh từ `UPLOAD_DIR` cần được sao lưu cùng nhau nếu muốn chuyển demo sang máy khác.
