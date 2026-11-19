# Buyer — Kịch bản demo, kiểm thử và vấn đáp

## Demo cho NTM (đã seed trên PostgreSQL **local**)

**Tài khoản thử nghiệm**: `buyer1@vcraft.demo` / `Demo@2026!`. Chỉ dùng cho local, không đặt lên Internet.

1. Đăng nhập ở `/dang-nhap`; vào `/buyer/rfqs` xác minh `RFQ-2026-DEMO1` bản nháp, DEMO2 đã gửi, DEMO3 đang có báo giá và phương án chờ duyệt.
2. Mở DEMO1 và sửa thông tin: danh mục, số lượng, ngân sách, hạn báo giá trong tương lai, ngày cần nhận sau hạn. Lưu nháp, tải lại. Ở DEMO2 kiểm tra chỉ sửa được liên hệ và địa chỉ.
3. Mở DEMO3: xem danh sách 3 xưởng được mời, 3 bid và phương án chia `2.000 + 1.800 + 1.200 = 5.000` sản phẩm. Xác nhận chấp nhận phương án: backend phải tạo **1 Order** có **3 ProductionTask**; RFQ chuyển `ACCEPTED`.
4. Vào `/buyer/don-hang` kiểm tra tổng tiền, tiến độ có trọng số theo **sản lượng**, không theo số xưởng. Ví dụ xưởng làm 100/100 mà xưởng kia 0/900 thì tiến độ phải là **10%**, không phải 50%.
5. Đăng xuất, đăng nhập `buyer2@vcraft.demo`; kiểm tra các RFQ/Order của buyer1 không xuất hiện trong danh sách. Buyer2 có một đơn `READY`, vào chi tiết chọn **Xác nhận đã nhận hàng**; đơn chuyển `DELIVERED`. Bấm lần hai hoặc gọi API lần hai phải từ chối 409.
6. Không đăng nhập mở `/truy-xuat/BT-DEMO-1` xem xưởng, sản phẩm cùng lô và timeline 5 mốc. Mở mã sai `/truy-xuat/SAI-MA` nhận giao diện 404.
7. Mở `/kham-pha` tìm kiếm, lọc danh mục, gợi ý tên xưởng; refresh giữ query string. Mở `/lang-nghe` để xem ghim và bộ lọc đón khách (dữ liệu mẫu).

**Lưu ý:** Khi cần thử đồng thời, chạy `backend/tests/integration/buyer-smoke.mjs` trên **DB vừa seed**, *trước* khi chấp nhận DEMO3 thủ công. Script tạo thay đổi có chủ ý, không thể chạy lặp nếu không reset DB.

## Ca kiểm thử quan trọng để NTM/nhóm xác nhận

| Ca | Thao tác | Kỳ vọng |
|---|---|---|
| AUTH-01 | Login sai 10+ lần trong 15 phút | Có giới hạn tốc độ, không tiết lộ email tồn tại |
| AUTH-02 | Logout rồi gọi `GET /api/auth/me` | 401 |
| PERM-01 | Buyer2 gọi RFQ ID của Buyer1 | 404 |
| PERM-02 | Buyer2 gọi Order ID của Buyer1 | 404 |
| PERM-03 | Buyer2 gọi `POST /api/plans/:id/accept` của Buyer1 | 404 |
| RFQ-01 | RFQ category không có xưởng được duyệt | 422 và RFQ vẫn `DRAFT` |
| RFQ-02 | Gửi RFQ hai lần | Lần sau 409, `Invitation` không trùng |
| RFQ-03 | Sửa `quantity` khi đã `SENT` | 409 |
| PLAN-01 | Plan thiếu/vượt quantity hoặc bid không hợp lệ | Không tạo Order |
| PLAN-02 | 2 request `accept` đồng thời | 1 Order + đủ tasks, cùng order ID khi idempotent |
| PLAN-03 | Reject rồi accept lại plan cũ | 409, không tạo Order |
| PLAN-04 | Ngắt/ép lỗi khi đang `accept` | Rollback toàn bộ transaction (cần kiểm DB) |
| ORDER-01 | `confirm-received` trước `READY` | 409 |
| ORDER-02 | `confirm-received` sau `READY`, đúng chủ | 200, RFQ/Order `DELIVERED` |
| TRACE-01 | Mã lô ẩn hoặc sai | 404, không lộ dữ liệu nội bộ |
| UI-01 | Màn hình 375px, 768px, 1280px; tab/Enter/Escape | Điều hướng/bảng/dialog dùng được |
| LAN-01 | Điện thoại quét QR chứa URL LAN | Mở đúng trang truy xuất công khai |

Các ca từ AUTH/PERM/PLAN cần PostgreSQL/session thật: **chưa chạy** trong môi trường tạo dự án. Bộ 12 unit test đã chạy độc lập để xác minh hàm tính tiền, phương án, ngày, điều hướng và slug.

## API flow liên vai trò cần N2/N3 ghép để có demo 100% thật

1. Admin duyệt workshop → N3 module `/api/admin/...`.
2. Artisan đăng sản phẩm/lô, nhật ký, tạo QR → N2 module `/api/workshops`, `/api/batches`, `/api/media`.
3. Buyer gửi RFQ → `POST /api/rfqs/:id/send` (N1), N3 cần duy trì matching/invitations.
4. Artisan upsert bid `PUT /api/rfqs/:id/bids/mine` → N3, đổi RFQ `SENT → BIDDING`.
5. Admin lập và gửi plan `POST /api/rfqs/:id/plans`, `PUT /api/plans/:id/items`, `POST /api/plans/:id/send` → N3.
6. Buyer `POST /api/plans/:id/accept` → N1 tạo Order + Tasks trong một transaction.
7. Artisan cập nhật `PATCH /api/tasks/:id/progress` → N2, khi lần đầu bắt đầu đổi RFQ `ACCEPTED → IN_PRODUCTION`; đủ task đổi Order `READY`.
8. Buyer `POST /api/orders/:id/confirm-received` → N1 đổi Order/RFQ `DELIVERED`.

## Vấn đáp nhanh

- **Tại sao dùng session HttpOnly mà không localStorage?** Cookie HttpOnly tránh JavaScript đọc token phiên; server có thể hủy phiên khi logout. Cần bảo vệ CSRF cho request thay đổi dữ liệu bằng kiểm Origin.
- **Tại sao phân quyền ở backend?** Frontend chỉ ẩn nút; người dùng vẫn có thể gọi API bằng công cụ HTTP. Mọi truy vấn RFQ/Order Buyer đều lọc bằng `buyerId` lấy từ session.
- **Tại sao approve plan là transaction?** Bước chuyển Plan/RFQ, tạo Order/ProductionTask và khóa Bid phải cùng commit; bất kỳ lỗi nào rollback toàn bộ.
- **Tại sao thêm unique index?** `Order.rfqId`, `Order.planId`, `ProductionTask.planItemId`, `(orderId,workshopId)` ngăn bản ghi trùng ngay ở DB khi có request đua.
- **Tại sao dùng BigInt cents trong kiểm tra?** Giá trị tiền tệ decimal không nên so sánh/tính tổng qua floating point; `toCents` cho phép xác thực số học chính xác theo 2 chữ số thập phân.
- **Tại sao truy xuất theo batch thay vì product?** Một lô chứa nhiều sản phẩm, tất cả chia sẻ cùng QR và các mốc nhật ký của lô. QR là liên kết tra cứu, không tự chứng minh nguồn gốc hàng thật.
- **Điểm cần ghép N2/N3?** N3 tạo bid/plan thật; N2 tạo batch/ảnh/QR và cập nhật task. Hiện chỉ có read bridge và seed để demo Buyer độc lập.
