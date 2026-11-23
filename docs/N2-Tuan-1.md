# Bàn giao Người 2 · Tuần 1

Mốc triển khai là ZIP `vCraft-main(1).zip` do nhóm cung cấp, SHA-256 `561bd81894eb4b849ef7f008fc35555c1e42fa0faee55b31b7d4bab909ce3dde`. ZIP có tài liệu và SVG thương hiệu, nên bản bàn giao thêm khung chạy local cho phần N2. Bát Tràng là làng nghề dùng cho demo, theo tài liệu nhóm.

## 1. Tám đầu việc

| Mã       | Bàn giao                                                                                                                                                               | Cách tự kiểm                                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| N2-T1-01 | [ERD của nhóm](03-database.md#1-sơ-đồ-erd) và [schema](../backend/prisma/schema.prisma) cho xưởng, danh mục, sản phẩm, lô, mốc và ảnh.                                 | Tìm khóa ngoại của từng bảng. Chỉ ra quan hệ nhiều–nhiều qua `BatchProduct` và `WorkshopCategory`.                           |
| N2-T1-02 | SVG thương hiệu của repo, [design tokens](../frontend/src/styles/tokens.css) và [component chung](../frontend/src/components/UI.jsx).                                  | Mở trang chủ ở 360 px và 1280 px. Chỉ ra ứng dụng của màu men lam, màu đất nung, nền men ngà, Lora và Be Vietnam Pro.        |
| N2-T1-03 | [Migration nền tảng](../backend/prisma/migrations/202611090001_workshop_foundation/migration.sql) tạo xưởng, ảnh, chứng nhận, danh mục và liên kết `WorkshopCategory`. | Chạy migrate trên database trắng. Kiểm tra `Workshop.ownerId` là FK và có UNIQUE.                                            |
| N2-T1-04 | Cùng migration tạo sản phẩm, ảnh sản phẩm, lô, bảng ghép và nhật ký. Có CHECK cho giá, số lượng, thứ tự và partial unique index cho ảnh đại diện.                      | Mở `/truy-xuat/BT-DEMO-01`. Xem hai sản phẩm có số lượng riêng, cùng mã lô và cùng nhật ký.                                  |
| N2-T1-05 | `GET/PATCH /api/me/workshop`, `GET /api/workshops/:slug` và [module xưởng](../backend/src/modules/workshops/).                                                         | Sửa hồ sơ bằng phiên Artisan rồi tải lại. Mở hồ sơ chờ duyệt trong tab khách và kiểm tra HTTP 404.                           |
| N2-T1-06 | [Form hồ sơ xưởng](../frontend/src/pages/WorkshopEditor.jsx) có lịch sử, giờ đón khách, gallery, chứng nhận và danh mục xưởng nhận làm.                                | Nhập hai giờ trùng trong cùng ngày, xem lỗi và focus ở ngày đó, sửa và lưu lại.                                              |
| N2-T1-07 | [Upload dùng chung](../backend/src/modules/media/media.service.js), danh sách/đổi thứ tự/xóa ảnh qua tài nguyên xưởng và upload một ảnh chứng nhận mỗi lượt.           | Tải WebP hợp lệ, rồi thử tệp giả đuôi hoặc quá giới hạn. Kiểm tra file của xưởng chưa duyệt chỉ chủ xưởng và Admin đọc được. |
| N2-T1-08 | [Trang chủ triển lãm](../frontend/src/pages/Home.jsx) có hero, câu chuyện nghề, gallery mở bằng bàn phím và hai CTA.                                                   | Bấm **Khám phá sản phẩm**, **Xem bản đồ làng**, mở một ảnh bằng Enter rồi đóng bằng Escape.                                  |

Mẫu dùng CSS tự viết, CSS Modules và token gốc theo [đặc tả UI](06-ui_design.md). Logo, favicon và SVG sản phẩm lấy từ repo nhóm. Các tệp WebP trong `frontend/public/images/` là ảnh minh họa tạo bằng OpenAI ImageGen, tái sử dụng từ bản vCraft đã cung cấp. Chúng minh họa nghề gốm, còn hồ sơ và tên xưởng trong seed là dữ liệu mẫu. Phông chữ dùng Fontsource và icon dùng Lucide.

## 2. Tự học bằng ba lần thử

### ERD và QR

Mở [schema](../backend/prisma/schema.prisma). Trong lô `BT-DEMO-01` có 10 bát và 4 bộ chén, nên `BatchProduct` có hai dòng chung `batchId`. Khóa chính ghép ngăn cùng một sản phẩm được ghi hai lần vào cùng lô. `ProductionMilestone.batchId` cho biết mốc thuộc lô nào. API QR lấy `batchCode` của lô để sinh URL, nên hai sản phẩm xem cùng nhật ký.

Đăng nhập bằng tài khoản xưởng đã duyệt. Có thể tìm ID của lô trong Prisma Studio bằng `npm exec -w backend -- prisma studio`. Mở `/api/me/batches/<id>/qr?format=png` hoặc dùng `format=svg`. Camera điện thoại qua LAN cần môi trường ghép có phiên chính thức và địa chỉ công khai đúng theo `07-setup.md`.

### Gọi API bằng form

Mở `/nghe-nhan/ho-so` và DevTools → Network. Sửa lịch sử gia đình rồi bấm **Lưu hồ sơ**. Theo thứ tự, React gửi `PATCH`, route lấy `req.user.id` do middleware phiên cấp, Zod kiểm tra dữ liệu và repository khóa dòng xưởng trước khi cập nhật. Thử thêm hai khung giờ trùng. JSON lỗi có `details[].field = "openingHours.mon"`, giúp form đưa thông báo về đúng Thứ Hai.

### Từ tệp chọn trên máy đến ảnh công khai

Thử tải ảnh lên bằng tài khoản chờ duyệt. Route kiểm tra vai trò và chủ xưởng trước khi Multer ghi tệp tạm. Sharp đọc định dạng từ nội dung, kiểm giới hạn ảnh tĩnh, loại metadata và tạo WebP tên UUID. Gallery có bản hiển thị tối đa 1600 px và thumbnail tối đa 400 px. Chứng nhận chỉ cần một ảnh. Nếu một ảnh trong lượt tải thất bại, service dọn toàn bộ file đã ghi của lượt đó. Khách chỉ xem được ảnh gắn với tài nguyên công khai.

## 3. Ghép với phần N1 và N3

| Điểm ghép              | Cách sử dụng                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema tài khoản       | `User`, `Session` và `UserStatus` trong bản này phục vụ demo độc lập. Khi ghép, dùng định nghĩa N1 và thêm quan hệ ngược `Workshop`, xưởng được duyệt và mốc do tài khoản cập nhật. N1 tạo hồ sơ `PENDING` khi đăng ký Artisan. Đưa các model N2 vào schema chung, sinh migration mới dựa trên nhánh nhóm và giữ SQL CHECK/partial index. Migration trong ZIP dành cho database trống. |
| Session và middleware  | `createApp` nhận điểm gắn session. Khi ghép, dùng middleware N1 đặt `req.user = { id, role }` từ phiên đã xác thực trước khi mount `workshopRoutes`. Định tuyến N2 dựa trên `req.user.id`. Phiên demo có tên cookie riêng, chỉ chạy local, dùng MemoryStore và chỉ nhận tài khoản seed đánh dấu demo.                                                                                  |
| Duyệt xưởng            | N3 cập nhật `Workshop.status`, `reviewedById`, `reviewedAt` và `rejectionReason`. Phần xưởng đọc các trạng thái đã thống nhất. Khi gửi lại hồ sơ bị từ chối, áp dụng chính sách do N3 chốt.                                                                                                                                                                                            |
| Giao diện và trang chủ | N1 gắn router, layout và API client chung. Dùng `ExhibitionHome` và truyền các khối độc lập `featured`, `studios`, `map`, `news`, `wholesale`. Dữ liệu sản phẩm, bản đồ dạng danh sách, API truy xuất và phiên trong bản này hỗ trợ chạy demo tuần 1 trong lúc ghép các module chính thức.                                                                                             |
| Media                  | Mount route `/uploads` với kiểm tra quyền theo tài nguyên. Không dùng static middleware phục vụ trực tiếp thư mục này vì chứa cả ảnh hồ sơ đang chờ duyệt. `maxUploadMb` trong hồ sơ riêng là metadata phục vụ hướng dẫn nhập liệu.                                                                                                                                                    |
| Review                 | Tạo nhánh từ `main` mới nhất, gắn mã N2-T1 vào PR. N3 review chính, thêm N1 khi ghép schema tài khoản, session hoặc API client.                                                                                                                                                                                                                                                        |

Bản tuần 1 dùng hợp đồng `PENDING/APPROVED/REJECTED`, `PATCH /api/me/workshop`, giờ dạng `{"mon":[["08:00","12:00"]]}` và chứng nhận chỉ nhận ảnh. Kho dữ liệu demo gồm một xưởng đã duyệt, một xưởng chờ duyệt, hai sản phẩm và một lô để kiểm chứng quan hệ. Seed đầy đủ và các module tuần sau đi theo phân công của repo nhóm.

## 4. Kiểm tra trước khi nộp

- Migrate trên database sạch bằng `prisma migrate deploy` và seed theo [README](../README.md).
- Chạy [kiểm thử PostgreSQL](../backend/test/workshop.test.js). Các nhóm ca kiểm tra quyền và trạng thái duyệt, lỗi lịch, loại/dung lượng ảnh, hoàn tác lượt upload, khóa ghép và QR.
- Dùng Chromium kiểm tra giao diện ở 360, 768 và 1280 px. Thử lỗi lịch, focus, upload và tải lại trang.

Bản bàn giao đã áp migration trên PostgreSQL 18.7 mới và nạp seed hai lần. Bộ kiểm thử server đạt 4/4 lượt đếm của Node Test Runner, gồm nhóm cha và ba nhóm con. Chromium đã kiểm tra trang chủ ở ba khổ, thao tác gallery bằng bàn phím, truy xuất lô mẫu, hồ sơ chờ duyệt, upload ảnh/chứng nhận và dữ liệu sau refresh. Camera điện thoại qua Wi-Fi chưa được thử trong lượt này.
