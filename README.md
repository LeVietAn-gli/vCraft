# vCraft

Triển lãm số gốm Bát Tràng. Nhánh Buyer kết nối triển lãm, sản phẩm và truy xuất của nhóm với quy trình mua sỉ, từ yêu cầu báo giá đến xác nhận nhận hàng.

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

Trước khi chạy `npm run seed` và `npm run dev`, mở `backend/.env` và điền `VCRAFT_DEMO_PASSWORD` với mật khẩu demo do bạn đặt (12–128 ký tự) và `SESSION_SECRET` với chuỗi ngẫu nhiên dài ít nhất 32 ký tự. Có thể tạo secret bằng `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Dùng một database riêng để demo. Nếu cổng 5432 bị chiếm, đổi cổng host trong Compose và cập nhật `DATABASE_URL`.

Mở [http://localhost:5173](http://localhost:5173). Chọn **Hồ sơ xưởng → Đăng nhập**, rồi dùng `xuong1@vcraft.local` (đã duyệt) hoặc `cho-duyet1@vcraft.local` (chờ duyệt) cùng mật khẩu đã đặt. Đổi tài khoản bằng cửa sổ riêng tư mới. Trình đăng nhập local chỉ áp dụng cho tài khoản seed được đánh dấu demo. Phiên người dùng được lưu trong PostgreSQL.

- Hồ sơ công khai `/xuong/men-lam`
- Hồ sơ đang chờ duyệt `/xuong/lua-am` (API công khai trả 404)
- Truy xuất lô mẫu `/truy-xuat/BT-DEMO-01`

## Chạy phần Buyer

Nếu máy đã chạy bản xưởng của nhóm, giữ file `backend/.env` hiện có. Dừng tiến trình dev trước khi cập nhật Prisma Client. Từ thư mục gốc chạy:

```powershell
npm ci
npm run db:generate
npm run db:migrate
npm run seed
npm run dev
```

Mở `/dang-ky` để tạo tài khoản người mua, hoặc vào `/dang-nhap` bằng `buyer1@vcraft.local`, `buyer2@vcraft.local`, `buyer3@vcraft.local` với mật khẩu demo đã cấu hình trước lần seed đầu tiên. Để chạy tài khoản Buyer tự đăng ký, cấu hình `SESSION_SECRET`. Phiên dùng cookie HttpOnly, bcrypt dùng cho mật khẩu của tài khoản tự đăng ký.

| Thử với Buyer | Kết quả |
|---|---|
| Tạo từ `/buyer/rfq/tao` hoặc từ trang sản phẩm | Liên hệ tự điền. Có thể lưu nháp rồi sửa, hoặc gửi đến các xưởng phù hợp. |
| Buyer 1 mở `RFQ-DEMO-02` từ `/buyer/rfq` | So sánh báo giá và xem phương án. Chấp nhận để tạo đơn, hoặc từ chối kèm lý do. |
| Buyer 1 mở đơn chờ nhận từ `/buyer/don-hang` | Xem tiến độ và xác nhận đã nhận hàng. |
| Buyer 2 mở đơn đang sản xuất | Xem 40/100 chiếc đã hoàn thành. Buyer 3 có một RFQ đã gửi. |
| Chạy seed lần nữa | Quyết định đã thực hiện và tiến độ đã lưu được giữ nguyên. |

Nhánh này cung cấp thao tác của Buyer và dữ liệu mẫu để demo các giai đoạn. Báo giá mới, phương án mới, cập nhật sản xuất và tin nổi bật của làng sẽ đến từ các module của thành viên phụ trách. Trên nhánh hiện tại, một RFQ mới gửi sẽ chờ ở bước nhận báo giá.

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
