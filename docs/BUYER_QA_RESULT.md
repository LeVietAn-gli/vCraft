# Buyer — Báo cáo kiểm tra tại thời điểm bàn giao (19/11/2026)

## Kiểm tra ĐÃ thực hiện trong môi trường biên soạn

| Mục | Công cụ | Kết quả |
|---|---|---|
| 12 unit tests (số tiền, trạng thái phương án, kiểm tra RFQ, slug, điều hướng) | `node --test backend/tests/*.test.js` / Node v22 | **12/12 PASS** |
| Cú pháp 34 file JavaScript backend/scripts/tests | `node backend/scripts/check-syntax.js` / `node --check` | **34/34 PASS** |
| Cú pháp 12 file JS/JSX và 2 file CSS của frontend | TypeScript compiler parser + PostCSS parser (cài sẵn trong môi trường biên soạn) | **14/14 PASS** |
| Tham chiếu import nội bộ JS/JSX | Kiểm tra tương đối theo đường dẫn | **Không phát hiện import thiếu** |
| Định dạng package JSON | JSON parser | **3/3 hợp lệ** |
| Số đầu việc Buyer trong `topics` và tài liệu đối chiếu | Script kiểm tra ID | **48/48** |

Các kiểm tra cú pháp không kiểm tra liên kết module, schema runtime hay hình ảnh render. Đây không phải kết quả chạy thử frontend/backend thực tế.

## Chưa được kiểm chứng trong môi trường này

- `npm install`: môi trường biên soạn không truy cập được npm registry.
- `npx prisma validate`, `prisma db push`, apply constraints, thực thi seed với PostgreSQL và migration chính thức: không có Prisma/PostgreSQL sẵn dùng.
- React `vite build`, mở browser, responsive/mobile/a11y, thử refresh deep URL: chưa chạy.
- Tích hợp login/session/CSRF/Origin/cookie, các endpoint thực tế, concurrency và transaction rollback: **phải** chạy với database thật.
- N2/N3: API tạo/chào bid, lập plan, cập nhật tiến độ và QR sinh ảnh; bản này chỉ có bridge GET để UI đọc dữ liệu demo.
- Kiểm thử quét QR qua điện thoại trên LAN và demo 3 vai trò: chưa thực hiện.

## Thứ tự test tiếp theo

1. `npm install` → `npm run db:generate --workspace backend` → `npm run db:push --workspace backend` → `npm run db:constraints --workspace backend`.
2. `npm run db:seed --workspace backend`; kiểm tra số lượng 3 Buyer, 6 xưởng approved, 30 sản phẩm, 6 RFQ.
3. `npm run build`, `npm run dev`, dùng browser vào form RFQ và trang đơn hàng.
4. **Trước khi chấp nhận DEMO3 qua UI**, chạy `node backend/tests/integration/buyer-smoke.mjs` trên DB dev mới seed để thử 2 accept đồng thời, quyền sở hữu, nhận hàng và session. Sau smoke, DEMO3 đã ACCEPTED và Buyer2 READY đã DELIVERED.
5. Chạy lại ca RFQ không matching, RFQ gửi lặp, plan stale, rollback có lỗi giả lập và role Artisan; cần phối hợp N2/N3.
6. N2/N3 ghép module ghi, review schema/migration; lặp lại đầy đủ test và thử QR trên điện thoại.

**Điều kiện để thay các nhãn "Đã viết/Chờ test" thành "Hoàn thành"**: hoàn tất các ca nghiệm thu của từng mã việc theo `topics` và `docs/08-team_workflow.md` (bao gồm review/merge có đồng đội xác nhận).
