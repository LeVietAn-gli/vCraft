# vCraft · Bàn giao tuần 3 của Người 2

| Mã       | Phần bàn giao                                                                                 | Nơi kiểm tra                                     |
| -------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| N2-T3-01 | API nhật ký kiểm tra chủ xưởng, ghi người cập nhật từ phiên, hỗ trợ đổi thứ tự                | `backend/src/modules/production/`                |
| N2-T3-02 | Form tạo/sửa lô với sản phẩm và số lượng, thêm/sửa mốc có ngày và album ảnh                   | `/nghe-nhan/lo-san-xuat`                         |
| N2-T3-03 | Timeline dùng chung cho trang quản lý lô và trang truy xuất, hỗ trợ nhiều ảnh và màn hình nhỏ | `frontend/src/components/ProductionTimeline.jsx` |
| N2-T3-04 | Một mã lô duy nhất, QR chứa URL tuyệt đối đến trang truy xuất của lô                          | `GET /api/me/batches/:id/qr`                     |
| N2-T3-05 | Tải PNG, tải SVG và in nhãn QR                                                                | `/nghe-nhan/lo-san-xuat/:id/qr`                  |
| N2-T3-06 | API truy xuất công khai trả xưởng đã duyệt, sản phẩm đang hiển thị, mốc và ảnh theo thứ tự    | `GET /api/trace/:batchCode`                      |
| N2-T3-07 | Lô ẩn hoặc mã sai trả 404. Mốc thiếu ngày, mô tả hoặc ảnh được hiển thị theo dữ liệu hiện có  | `/truy-xuat/:maLo`                               |
| N2-T3-08 | Đề xuất hợp đồng dữ liệu và quy tắc tiến độ để N1/N3 rà soát chung                            | Phần cuối tài liệu này                           |

## Demo theo thứ tự

1. Chạy bản tuần 2 theo README. Đăng nhập vào xưởng đã duyệt và mở **Quản lý lô**. Tạo một lô với ít nhất hai sản phẩm của xưởng, mỗi sản phẩm có số lượng nguyên dương.
2. Thêm hai mốc. Sửa tên, ngày hoặc mô tả. Mở **Quản lý ảnh** của một mốc để thêm nhiều ảnh. Dùng nút lên/xuống để đổi thứ tự.
3. Mở **Mã QR**, tải cả PNG và SVG rồi thử in. Trước khi công khai lô, mở đường dẫn truy xuất bằng cửa sổ riêng tư để thấy trạng thái không tìm thấy.
4. Công khai lô và mở lại đường dẫn truy xuất. Kiểm tra hai sản phẩm cùng nằm trên một trang và nhật ký hiển thị theo thứ tự vừa lưu. Khi tạo mốc không có ngày, timeline hiển thị **Chưa ghi thời điểm**.

## API và luồng xử lý

| Phương thức và đường dẫn                           | Tác dụng                                                              |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| `GET /api/me/batches`                              | Danh sách lô của xưởng, theo quy ước phân trang hiện có               |
| `POST /api/me/batches`                             | Tạo lô và danh sách sản phẩm cùng số lượng                            |
| `GET/PATCH/DELETE /api/me/batches/:id`             | Xem, sửa hoặc xóa lô nháp riêng tư                                    |
| `POST /api/me/batches/:id/milestones`              | Thêm mốc cuối nhật ký                                                 |
| `PATCH /api/me/batches/:id/milestones/order`       | Lưu toàn bộ thứ tự mốc, qua mảng `ids`                                |
| `PATCH/DELETE /api/me/milestones/:id`              | Sửa hoặc xóa mốc                                                      |
| `POST/DELETE /api/me/milestones/:id/images`        | Dùng lại chức năng album tuần 2, xem đường dẫn xóa ảnh trong `app.js` |
| `GET /api/me/batches/:id/qr?format=png&download=1` | Tải QR khi là chủ lô, có thể chọn `format=svg`                        |
| `GET /api/trace/:batchCode`                        | Truy xuất lô công khai, trả 404 khi mã sai hoặc lô ẩn                 |

- Route dùng middleware phiên, vai trò và Zod. Chủ xưởng được xác định từ `req.user.id`. Repository kiểm tra xưởng đã duyệt, lô thuộc xưởng và các sản phẩm được chọn thuộc cùng xưởng.
- Mỗi hàng `BatchProduct` lưu sản phẩm và số lượng trong lô. URL QR dùng mã của `ProductionBatch`, nên hai sản phẩm trong cùng lô cùng trỏ đến một trang.
- Repository khóa xưởng trong giao dịch khi cập nhật dữ liệu lô hoặc mốc. Đổi thứ tự dời các vị trí cũ sang vùng tạm rồi gán vị trí mới để tránh trùng `orderIndex` giữa chừng. Người cập nhật được lấy từ phiên, kể cả khi đổi ảnh mốc.
- Public API chọn một tập trường công khai. `occurredAt` và mô tả có thể là `null`, ảnh có thể là mảng rỗng. Timeline dùng `orderIndex` vì đây là thứ tự nhật ký do nghệ nhân lưu, còn ngày mô tả thời điểm diễn ra.

## Quét QR bằng điện thoại qua Wi-Fi LAN

Dùng bản build do Express phục vụ. Máy tính và điện thoại kết nối cùng mạng Wi-Fi.

1. Chạy `npm run build`. Trong `backend/.env` đặt `APP_PUBLIC_URL=http://192.168.1.25:3000` (thay bằng IP LAN thật của máy), `CLIENT_ORIGIN=http://127.0.0.1:3000`, `HOST=127.0.0.1`. Giữ mật khẩu demo và secret đã tạo để đăng nhập local.
2. Chạy `npm start` và mở `http://127.0.0.1:3000`. Đăng nhập, công khai lô, tải hoặc in QR. QR sẽ chứa IP LAN đã cấu hình.
3. Dừng server. Đổi `HOST=0.0.0.0` và thêm `NODE_ENV=production` vào `backend/.env`, giữ nguyên địa chỉ công khai, database và thư mục ảnh. Chạy lại `npm start`. Bản chạy này phục vụ trang truy xuất cho khách và tắt đăng nhập demo.
4. Dùng camera quét mã. Nếu điện thoại không kết nối được, thử mở trực tiếp địa chỉ IP LAN và cổng 3000. Với bản triển khai công khai, dùng origin HTTPS của website làm `APP_PUBLIC_URL`.
5. Sau demo LAN, trở về cấu hình local trước khi tiếp tục phát triển.

## N2-T3-08 · Hợp đồng tích hợp nhiệm vụ sản xuất

Đề xuất theo `docs/03-database.md` và `docs/04-quotation_flow.md`, cần N1 và N3 cùng xác nhận trước khi ghép phần đặt hàng. Schema Prisma tuần 2 đang thiếu `ProductionTask` và phần đơn hàng tương ứng trong bản chạy này. Đây là **ERD GAP** nếu triển khai bảng và API nhiệm vụ vào bản hiện tại.

| Trường                                                | Ý nghĩa                                                                                                             |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `id`, `orderId`, `workshopId`, `planItemId`           | Định danh nhiệm vụ, đơn, xưởng và dòng phương án. `planItemId` duy nhất và mỗi cặp đơn-xưởng duy nhất theo ERD nhóm |
| `quantity`, `completedQuantity`, `unitPrice`          | Số lượng giao, lượng hoàn thành và đơn giá phương án. Tiến độ nằm trong khoảng 0 đến số lượng giao                  |
| `dueDate`, `status`                                   | Hạn hoàn thành (ngày) và trạng thái ban đầu `ASSIGNED`                                                              |
| `batchId`, `progressNote`, `startedAt`, `completedAt` | Lô của xưởng phụ trách nếu có, ghi chú và các mốc thực hiện                                                         |

- N1 tạo nhiệm vụ từ phương án đã được chấp nhận. Nghệ nhân cập nhật nhiệm vụ của xưởng mình. N3 giám sát tiến độ.
- Luồng nhiệm vụ là `ASSIGNED → IN_PROGRESS → COMPLETED`, đồng thời hỗ trợ `ASSIGNED → COMPLETED`. Khi hoàn thành, lượng hoàn thành bằng lượng được giao. Nhiệm vụ hoàn thành kết thúc luồng chỉnh sửa.
- Cập nhật nhiệm vụ và tiến độ đơn trong cùng giao dịch khi tích hợp. Lần đầu một nhiệm vụ rời `ASSIGNED`, đồng bộ trạng thái đang sản xuất lên đơn/RFQ theo luồng đã chốt. Khi tất cả nhiệm vụ hoàn thành, đơn chuyển `READY`. Buyer sở hữu đơn xác nhận `DELIVERED`.
