# Buyer / N1 — Đối chiếu 48 công việc trong kế hoạch

**Căn cứ:** `topics/vCraft.docx`, `topics/vCraft_Ke_hoach_3_nguoi_6_tuan.xlsx` (sheet `Nguoi 1 - Buyer`, 6 tuần × 8 việc) và `docs/01..08`.

**Cách đọc:** "Đã viết" chỉ xác nhận có mã nguồn; **không có nghĩa nghiệm thu xong**. Bản này chưa chạy ứng dụng thật vì môi trường thực hiện không có npm registry/PostgreSQL. "Chờ" chỉ rõ phụ thuộc của N2/N3 hoặc kiểm thử cần làm.

## Phân chia trách nhiệm và đường găng

- **N1 / Buyer (NTM):** xác thực, UI nền, RFQ, duyệt kế hoạch, tạo Order/ProductionTask, đơn hàng, xác nhận nhận hàng, trang public QR.
- **N2 / Artisan:** CRUD xưởng/sản phẩm, gallery/ảnh, lô/QR/timeline, task progress, bản đồ; đây là điểm phụ thuộc để tiến độ/truy xuất chạy đúng.
- **N3 / Admin:** xét duyệt xưởng, matching, gửi invitation, bid và lập/sửa/gửi allocation plan; đây là điểm phụ thuộc để RFQ tạo mới đi hết E2E.

**Đường găng:** Auth → RFQ DRAFT/SENT → matching/lời mời (N3) → bid (N3) → plan (N3) → accept/tạo order (N1) → task progress/READY (N2) → xác nhận nhận hàng (N1).

## Ma trận từng đầu việc

### Tuần 1

| Mã | Công việc trong bảng phân công | Trạng thái mã | Bằng chứng mã nguồn | Việc chưa được nghiệm thu |
|---|---|---|---|---|
| N1-T1-01 | Chốt phạm vi, quy tắc tài khoản và phân quyền | **Đã viết** | `docs/01-requirements.md`, `backend/src/middlewares/auth.js` | Chưa đối chiếu với người 2, 3 |
| N1-T1-02 | Khởi tạo frontend và backend JavaScript | **Đã viết** | `package.json`, `frontend/`, `backend/` | Chưa chạy full build/start |
| N1-T1-03 | Chốt hợp đồng API và quy ước lỗi | **Có tài liệu** | `docs/05-api.md`, `backend/src/utils/error.js` | Cần N2/N3 xác nhận hợp đồng khi ghép |
| N1-T1-04 | Thiết kế bảng tài khoản, RFQ và đơn hàng | **Đã viết** | `backend/prisma/schema.prisma`, `docs/03-database.md` | Chưa chạy Prisma validate/db push |
| N1-T1-05 | Tạo migration và seed tài khoản ban đầu | **Một phần** | `backend/prisma/seed.js`, `backend/prisma/EXTRA_CONSTRAINTS.sql` | Có seed/db push nhưng chưa sinh/test migration |
| N1-T1-06 | API đăng ký Buyer và Artisan | **Đã viết** | `backend/src/modules/auth/` | Chưa thử API + CSDL |
| N1-T1-07 | API đăng nhập, đăng xuất và phiên làm việc | **Đã viết** | `backend/src/app.js`, `backend/src/modules/auth/auth.routes.js` | Chưa thử cookie/login server thật |
| N1-T1-08 | Làm form đăng nhập, đăng ký và lấy người dùng hiện tại | **Đã viết** | `frontend/src/pages/AuthPages.jsx`, `AuthContext.jsx` | Chưa test trình duyệt |

### Tuần 2

| Mã | Công việc trong bảng phân công | Trạng thái mã | Bằng chứng mã nguồn | Việc chưa được nghiệm thu |
|---|---|---|---|---|
| N1-T2-01 | Làm middleware xác thực và phân quyền | **Đã viết** | `backend/src/middlewares/` | Chưa kiểm tra đủ ma trận quyền trên PostgreSQL |
| N1-T2-02 | Thiết kế header/footer, menu theo vai trò và định tuyến URL thống nhất | **Đã viết** | `frontend/src/App.jsx`, `layouts/SiteLayout.jsx` | Chưa test hard refresh trên web server |
| N1-T2-03 | Kết nối trang chủ với dữ liệu API | **Đã viết** | `frontend/src/pages/PublicPages.jsx` | API công khai đang dùng read-only bridge |
| N1-T2-04 | Xây API tạo, sửa và đọc RFQ nháp | **Đã viết** | `backend/src/modules/rfq/` | Cần DB test CRUD 2 Buyer |
| N1-T2-05 | Form RFQ có tự điền, gợi ý và chuẩn hóa dữ liệu | **Đã viết** | `frontend/src/pages/RfqPages.jsx` | Chưa test form mobile |
| N1-T2-06 | Làm gửi RFQ và quy tắc sửa sau gửi | **Đã viết** | `backend/src/modules/rfq/rfq.service.js` | Gửi/matching cần chạy trên DB thật |
| N1-T2-07 | Danh sách RFQ và bộ lọc trạng thái gọn nhẹ | **Đã viết** | `frontend/src/pages/RfqPages.jsx` | Chưa test phân trang với seed lớn |
| N1-T2-08 | Chuẩn hóa quy ước code và lớp truy cập dữ liệu | **Một phần** | `src/modules/`, `src/api/`; `docs/08-team_workflow.md` | Controller còn gộp trong route; chưa có ESLint/Prettier |

### Tuần 3

| Mã | Công việc trong bảng phân công | Trạng thái mã | Bằng chứng mã nguồn | Việc chưa được nghiệm thu |
|---|---|---|---|---|
| N1-T3-01 | Hoàn thiện trang Buyer: RFQ cần xử lý và hành động tiếp theo | **Đã viết** | `frontend/src/pages/RfqPages.jsx` | Cần bid/plan do N3 tạo thực tế |
| N1-T3-02 | Kết nối danh sách xưởng được mời và báo giá | **Một phần** | `backend/src/integration/buyer-read.routes.js` | Thay bằng N3 bids/plan endpoints khi ghép |
| N1-T3-03 | Trang Buyer xem và xác nhận phương án điều phối chờ duyệt | **Đã viết** | `frontend/src/pages/RfqPages.jsx` | Cần N3 gửi phương án thật |
| N1-T3-04 | Cho Buyer chấp nhận hoặc từ chối phương án | **Đã viết** | `backend/src/modules/orders/orders.service.js` | Chưa thử trên DB thật |
| N1-T3-05 | Thiết kế transaction duyệt phương án và tạo đơn | **Đã viết** | `backend/src/modules/orders/orders.service.js`, `schema.prisma` | Chưa stress test đồng thời DB |
| N1-T3-06 | API Buyer chấp nhận phương án và chống duyệt lặp | **Đã viết** | `backend/src/modules/orders/orders.service.js` | Có smoke harness, chưa chạy DB |
| N1-T3-07 | Tạo đơn và nhiệm vụ cho từng xưởng trong transaction | **Đã viết** | `backend/src/modules/orders/orders.service.js` | Có transaction, chưa kiểm tra rollback DB |
| N1-T3-08 | Xây trang truy xuất nguồn gốc công khai /truy-xuat/:maLo | **Một phần** | `frontend/src/pages/PublicPages.jsx`, `integration/public-read.routes.js` | Trang public xong code; N2 phải thay trace API và QR thật |

### Tuần 4

| Mã | Công việc trong bảng phân công | Trạng thái mã | Bằng chứng mã nguồn | Việc chưa được nghiệm thu |
|---|---|---|---|---|
| N1-T4-01 | Làm danh sách và chi tiết đơn hàng Buyer | **Đã viết** | `frontend/src/pages/OrderPages.jsx`, `backend/src/modules/orders/` | Chưa test API hai Buyer |
| N1-T4-02 | Hiển thị tiến độ từng xưởng và toàn đơn | **Đã viết** | `src/domain/money.js`, `frontend/src/pages/OrderPages.jsx` | Chưa ghép N2 cập nhật task |
| N1-T4-03 | Làm xác nhận nhận hàng | **Đã viết** | `backend/src/modules/orders/orders.service.js` | Chưa test READ/READY/DELIVERED DB |
| N1-T4-04 | Xử lý phiên hết hạn và chuyển hướng sau đăng nhập | **Đã viết** | `frontend/src/context/AuthContext.jsx` | Chưa test session TTL bằng trình duyệt |
| N1-T4-05 | Xây bộ lọc catalog và gợi ý tìm xưởng trên giao diện | **Đã viết** | `frontend/src/pages/PublicPages.jsx` | N2 cần thay API catalog/suggest |
| N1-T4-06 | Kiểm tra và hoàn thiện RFQ gửi-mời-chào giá sau MVP tuần 3 | **Chờ tích hợp** | `backend/tests/integration/buyer-smoke.mjs` | N2/N3 chưa có nghiệp vụ tạo bid trong dự án đính kèm |
| N1-T4-07 | Ghép tiến độ sản xuất vào đơn Buyer sau MVP | **Chờ tích hợp** | `frontend/src/pages/OrderPages.jsx` | N2 chưa có endpoint sửa tiến độ sản xuất |
| N1-T4-08 | Rà soát và hoàn thiện trải nghiệm trang công khai | **Một phần** | `frontend/src/pages/PublicPages.jsx`, `styles/global.css` | Chưa kiểm thử mobile/accessibility thực tế |

### Tuần 5

| Mã | Công việc trong bảng phân công | Trạng thái mã | Bằng chứng mã nguồn | Việc chưa được nghiệm thu |
|---|---|---|---|---|
| N1-T5-01 | Kiểm thử đăng nhập, đăng xuất và trạng thái phiên | **Chờ test DB** | `backend/tests/integration/buyer-smoke.mjs` | Không có môi trường session chạy thực |
| N1-T5-02 | Kiểm thử quyền sở hữu RFQ và đơn hàng | **Chờ test DB** | `backend/tests/integration/buyer-smoke.mjs` | Chưa thử swap ID Buyer A/B qua HTTP thật |
| N1-T5-03 | Kiểm thử duyệt hai request đồng thời | **Chờ test DB** | `backend/tests/integration/buyer-smoke.mjs` | Cần chạy song song trên PostgreSQL |
| N1-T5-04 | Kiểm thử rollback, từ chối và duyệt trùng | **Một phần** | `backend/tests/money.test.js`, `integration/buyer-smoke.mjs` | Đã unit 12/12; rollback DB chưa thử |
| N1-T5-05 | Hoàn thiện responsive và accessibility phần Buyer | **Một phần** | `frontend/src/styles/global.css`, `components/UI.jsx` | Chưa chạy browser/a11y audit |
| N1-T5-06 | Chuẩn hóa lỗi API, loading và thử lại | **Đã viết** | `frontend/src/api/client.js`, `components/UI.jsx` | Chưa thử mất mạng và lỗi HTTP thật |
| N1-T5-07 | Rà soát cookie, CSRF và giới hạn đăng nhập | **Đã viết** | `backend/src/middlewares/csrf.js`, `backend/src/app.js` | Chưa kiểm thử xâm nhập/hardening production |
| N1-T5-08 | Kiểm thử kết nối React–API và QR trên mạng demo | **Chờ test LAN** | `backend/tests/integration/buyer-smoke.mjs` | Thiếu LAN/điện thoại và QR N2 |

### Tuần 6

| Mã | Công việc trong bảng phân công | Trạng thái mã | Bằng chứng mã nguồn | Việc chưa được nghiệm thu |
|---|---|---|---|---|
| N1-T6-01 | Viết seed Buyer, RFQ và đơn hàng nhiều trạng thái | **Đã viết** | `backend/prisma/seed.js` | Có 3 Buyer, 6 RFQ; chưa chạy seed DB thực |
| N1-T6-02 | Viết hướng dẫn cài đặt và cấu hình môi trường | **Đã viết** | `README.md`, `.env.example`, `docker-compose.yml` | Chưa nhờ người mới chạy theo README |
| N1-T6-03 | Ôn tập API, ORM và giải thích kiến trúc khi vấn đáp | **Một phần** | `docs/BUYER_DEMO.md`, `docs/04-quotation_flow.md` | Tài liệu giải thích chuẩn bị; cần luyện vấn đáp |
| N1-T6-04 | Chạy demo liên vai trò từ RFQ mới đến nhận hàng | **Chờ cả nhóm** | `docs/BUYER_DEMO.md` | N2/N3 chưa có các API ghi tương ứng |
| N1-T6-05 | Sửa lỗi cuối cùng thuộc tài khoản và Buyer | **Một phần** | `backend/tests/`, rà soát code | Cần issues khi có app chạy thật |
| N1-T6-06 | Review quy trình chia đơn của Người 3 | **Chờ N3** | `backend/src/domain/money.js`, `money.test.js` | N3 chưa có module viết/điều chỉnh phương án |
| N1-T6-07 | Chuẩn bị phần demo và vấn đáp Buyer | **Đã viết hướng dẫn** | `docs/BUYER_DEMO.md` | Demo/vấn đáp chưa diễn tập với cả nhóm |
| N1-T6-08 | Chốt source và bàn giao phần Người 1 | **Bàn giao ZIP** | `README.md`, `docs/BUYER_IMPLEMENTATION.md` | Chưa review PR / merge vào Git nhóm |

## Việc cần làm trước khi đánh dấu "Hoàn thành" trên spreadsheet

1. Cài `npm install`, khởi tạo PostgreSQL, chạy Prisma schema và các ràng buộc SQL, thực thi seed; xem `README.md`.
2. Chạy `npm run build`, `npm test`; mở app và thử refresh, cookie, lỗi server.
3. Chạy `node backend/tests/integration/buyer-smoke.mjs` trên **DB dev có thể xóa**, sau đó xác minh trong PostgreSQL số `Order` và `ProductionTask` đúng.
4. Ghép nhánh N3 để Artisan tạo bid, Admin lập plan thật; ghép N2 để Artisan cập nhật task, chuyển READY, QR ảnh thật.
5. Test responsive 375/768/1280 px, tab keyboard, dialog, trình duyệt mobile, điện thoại quét QR qua LAN.
6. Chốt migration chính thức, PR có reviewer theo `08-team_workflow.md`, và chỉ khi đó mới cập nhật ô hoàn thành trong XLSX gốc.

## Các rủi ro và quyết định triển khai

- Chưa có `node_modules`/PostgreSQL trong môi trường soạn mã nên không thể chứng thực hành vi transaction (dù code dùng compare-and-set/unique).
- Không viết đè API ghi của N2/N3; chỉ cung cấp **read-only bridge**, dữ liệu mẫu trong seed để UI Buyer không bị chặn.
- Không thêm thanh toán trực tuyến/giỏ hàng, vì nằm ngoài phạm vi đề tài.
- Dữ liệu tên xưởng, địa chỉ và ảnh trong seed hoàn toàn **minh họa**, không được quảng bá như dữ liệu doanh nghiệp xác thực.
