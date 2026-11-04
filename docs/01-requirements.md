# 01 — Đặc tả yêu cầu (Requirements)

> Dự án: **vCraft — Tinh hoa làng nghề, muôn phương lan tỏa**
> Môn học: INT3306 — Phát triển ứng dụng web (Fall 2026)
> Làng nghề mẫu dùng cho dữ liệu demo: **Làng gốm Bát Tràng** *(đổi theo nghề nhóm chốt ở N2-T1-02)*

---

## 1. Mục tiêu sản phẩm

vCraft là nền tảng web dành cho **Ban quản lý (BQL) làng nghề**, với ba mục tiêu:

1. **Triển lãm số**: mỗi hộ/nghệ nhân có một không gian riêng để kể câu chuyện làm nghề và trưng bày sản phẩm.
2. **Minh bạch nguồn gốc**: mỗi **lô sản xuất** có *Nhật ký sản xuất* và **một mã QR dùng chung** cho mọi sản phẩm trong lô. Khách quét mã sẽ xem toàn bộ quy trình làm ra lô hàng đó.
3. **Điều phối đơn sỉ**: Buyer tạo *Yêu cầu báo giá (RFQ)* → hệ thống tự mời các xưởng phù hợp → các xưởng chào giá → **Admin lập phương án chia đơn** → Buyer duyệt → hệ thống tạo đơn và giao nhiệm vụ cho từng xưởng.

## 2. Vai trò người dùng

| Mã | Vai trò | Mô tả |
|----|---------|-------|
| `GUEST` | Khách vãng lai | Chưa đăng nhập. Xem trang chủ, sản phẩm, xưởng, bản đồ, tin tức và trang truy xuất QR |
| `BUYER` | Khách hàng / Khách mua sỉ / Du khách | Tạo RFQ, xem báo giá, duyệt phương án, theo dõi đơn, xác nhận nhận hàng |
| `ARTISAN` | Hộ gia đình / Nghệ nhân | Chỉ dùng được chức năng xưởng sau khi Admin duyệt. Quản lý hồ sơ, sản phẩm, lô và nhật ký; chào giá; thực hiện nhiệm vụ sản xuất |
| `ADMIN` | BQL / Chủ tịch xã / Hội làng nghề | Duyệt hộ, lập phương án chia đơn, theo dõi đơn toàn làng, quản lý tin cộng đồng |

## 3. Yêu cầu chức năng

Mức ưu tiên: **M** = Must (bắt buộc theo đề), **S** = Should (nên có), **C** = Could (điểm cộng). Cột **Phụ trách** tham chiếu mã việc trong bảng phân công.

### 3.1. Chung (Tài khoản, phiên, điều hướng)

| Mã | Chức năng | Ưu tiên | Phụ trách |
|----|-----------|---------|-----------|
| AUTH-01 | Đăng ký Buyer. Chặn dữ liệu thiếu và email trùng | M | N1-T1-06 |
| AUTH-02 | Đăng ký Artisan. Tài khoản ở trạng thái **chờ duyệt** | M | N1-T1-06 |
| AUTH-03 | Đăng nhập, đăng xuất bằng **session + cookie HttpOnly**. Đăng xuất làm phiên mất hiệu lực ở server; tải lại trang vẫn giữ đúng phiên | M | N1-T1-07, N1-T1-08 |
| AUTH-04 | Middleware xác thực và phân quyền theo vai trò, kèm **kiểm tra chủ sở hữu** ở server | M | N1-T2-01 |
| AUTH-05 | Xử lý phiên hết hạn: chuyển tới trang đăng nhập rồi **quay lại đúng trang đang xem**, không lặp điều hướng | S | N1-T4-04 |
| AUTH-06 | Header, footer và menu theo vai trò (desktop/mobile). Tải lại một đường dẫn sâu không bị 404 | M | N1-T2-02 |

### 3.2. Artisan — Hộ gia đình / Nghệ nhân

| Mã | Chức năng | Ưu tiên | Phụ trách |
|----|-----------|---------|-----------|
| ART-01 | **Hồ sơ xưởng**: lịch sử gia đình, gallery ảnh xưởng, chứng nhận chất lượng (upload), giờ mở cửa, cờ cho phép khách tham quan. Chỉ xưởng **đã duyệt** mới hiển thị công khai | M | N2-T1-05, N2-T1-06 |
| ART-02 | Chọn **tọa độ xưởng** bằng cách click trên bản đồ | M | N2-T4-02 |
| ART-03 | CRUD sản phẩm: danh mục, thông số, giá, trạng thái, **nhiều ảnh**; slug duy nhất cho `/san-pham/:slug`. Chỉ sửa được sản phẩm của xưởng mình | M | N2-T2-01, N2-T2-02 |
| ART-04 | Tạo **lô sản xuất** gồm nhiều sản phẩm và số lượng tương ứng | M | N2-T3-02 |
| ART-05 | Thêm, sửa các **mốc nhật ký** của lô (ví dụ Nhào đất → Vuốt → Phơi → Nung → Thành phẩm). Mỗi mốc có thời gian, mô tả và nhiều ảnh. Hệ thống lưu người cập nhật và thứ tự | M | N2-T3-01, N2-T3-02 |
| ART-06 | Tải về và in **mã QR của lô** | M | N2-T3-04, N2-T3-05 |
| ART-07 | Xem danh sách và chi tiết các **RFQ được mời**, có lọc theo trạng thái | M | N3-T2-03 |
| ART-08 | **Gửi và sửa báo giá**: số lượng nhận làm, đơn giá, thời gian hoàn thành, ghi chú. Chỉ được khi có lời mời, còn hạn và báo giá chưa bị khóa | M | N3-T2-04, N3-T2-05 |
| ART-09 | Xem danh sách và chi tiết **nhiệm vụ sản xuất** được giao cho xưởng mình | M | N2-T4-04 |
| ART-10 | Cập nhật tiến độ, đánh dấu hoàn thành và bàn giao nhiệm vụ. **Không** được tự xác nhận thay Buyer là đã nhận hàng | M | N2-T4-05, N2-T4-06 |

### 3.3. Buyer — Khách hàng / Du khách

| Mã | Chức năng | Ưu tiên | Phụ trách |
|----|-----------|---------|-----------|
| BUY-01 | Trang chủ dạng triển lãm số. Sản phẩm, xưởng và tin nổi bật lấy từ API | M | N2-T1-08, N1-T2-03 |
| BUY-02 | `/kham-pha`: xem sản phẩm **theo phân loại** hoặc **theo xưởng**; grid ảnh lớn, phân trang/lazy-load | M | N2-T2-04, N2-T2-05 |
| BUY-03 | Bộ lọc catalog và **gợi ý tìm xưởng (autocomplete)**. Bộ lọc lưu trong query string nên vẫn giữ được khi refresh | S | N1-T4-05, N2-T2-07 |
| BUY-04 | Chi tiết sản phẩm `/san-pham/:slug` (gallery, xưởng sở hữu, lô liên quan, nút tạo RFQ) và hồ sơ xưởng `/xuong/:slug` | M | N2-T2-06 |
| BUY-05 | **Bản đồ làng nghề** `/lang-nghe`: pin hai màu phân biệt xưởng nhận và không nhận khách; popup có ảnh, giờ mở và link tới xưởng; lọc các xưởng đang nhận khách tham quan | M | N2-T4-01, N2-T4-02 |
| BUY-06 | **Trang truy xuất công khai** `/truy-xuat/:maLo`: xưởng, các sản phẩm cùng lô, ảnh và timeline nhật ký. Hiển thị tốt trên mobile, có 404 khi mã sai | M | N1-T3-08 |
| BUY-07 | Tạo và sửa **RFQ nháp**: tự điền thông tin Buyer, gắn sản phẩm/xưởng tham khảo, gợi ý danh mục, kiểm tra số lượng và hạn giao | M | N1-T2-04, N1-T2-05 |
| BUY-08 | **Gửi RFQ**: server kiểm tra lại dữ liệu và chuyển trạng thái; hệ thống **tự động mời** các xưởng phù hợp. Giới hạn những gì được sửa sau khi gửi | M | N1-T2-06, N3-T2-02 |
| BUY-09 | Danh sách RFQ của mình, lọc theo trạng thái | M | N1-T2-07 |
| BUY-10 | Xem các xưởng được mời và **bảng so sánh báo giá** của RFQ mình sở hữu | M | N1-T3-02, N3-T2-06 |
| BUY-11 | Xem **phương án chia đơn** do Admin gửi (xưởng, số lượng, đơn giá, tổng, hạn), rồi **chấp nhận** hoặc **từ chối** (có thể ghi lý do) | M | N1-T3-03, N1-T3-04 |
| BUY-12 | Danh sách và chi tiết **đơn hàng**; xem tiến độ **từng xưởng** và **toàn đơn** | M | N1-T4-01, N1-T4-02 |
| BUY-13 | **Xác nhận đã nhận hàng**. Chỉ Buyer sở hữu đơn mới làm được, và đơn phải đúng trạng thái | M | N1-T4-03 |

### 3.4. Admin — Ban quản lý làng nghề

| Mã | Chức năng | Ưu tiên | Phụ trách |
|----|-----------|---------|-----------|
| ADM-01 | Danh sách hồ sơ nghệ nhân **chờ duyệt**; **duyệt** hoặc **từ chối** kèm lý do | M | N3-T1-05, N3-T1-06 |
| ADM-02 | Xem báo giá và **lập phương án chia đơn**: chọn xưởng, nhập số lượng phân bổ. Server kiểm tra tổng lượng, cam kết của từng xưởng và tự tính tổng tiền | M | N3-T3-01..05 |
| ADM-03 | **Gửi phương án** cho Buyer. Sau khi gửi thì phương án bị khóa chỉnh sửa. Nếu Buyer từ chối, Admin lập phương án mới | M | N3-T3-06, N3-T4-06 |
| ADM-04 | Danh sách, chi tiết và bộ lọc **đơn toàn làng**: từng xưởng, lượng giao, tiến độ | M | N3-T4-02 |
| ADM-05 | Quản lý **tin cộng đồng** thuộc đúng 3 nhóm: *giá nguyên vật liệu*, *lịch cúp điện*, *chính sách hỗ trợ*; có ảnh tùy chọn, ẩn hoặc đăng bài | M | N3-T2-08, N3-T4-04 |
| ADM-06 | Trang tin cộng đồng công khai, có tab lọc theo 3 nhóm | M | N3-T4-05 |
| ADM-07 | **Dashboard tối giản**: số xưởng chờ duyệt, số RFQ đang xử lý, số đơn đang sản xuất | S | N3-T4-01 |
| ADM-08 | Can thiệp lời mời khi cần, ví dụ RFQ không tìm được xưởng phù hợp | C | N3-T2-02 |

## 4. Yêu cầu kỹ thuật bắt buộc (theo đề)

| Mã | Yêu cầu | Cách đáp ứng |
|----|---------|--------------|
| TECH-01 | Lưu vòng đời sản phẩm dưới dạng mảng các mốc thời gian kèm ảnh minh chứng | Các mốc gắn với **lô sản xuất**; sản phẩm thuộc lô sẽ kế thừa nhật ký của lô (ART-04, ART-05) |
| TECH-02 | Tự sinh mã QR; quét mã mở landing page truy xuất | Mỗi lô có một `maLo` duy nhất; QR mã hóa `APP_PUBLIC_URL/truy-xuat/:maLo` (ART-06, BUY-06) |
| TECH-03 | State machine báo giá: Draft → Sent → Bidding → Buyer Accepted → In Production → Delivered, có khóa bản ghi | Có thêm **phương án chia đơn** trước bước Buyer Accepted; tạo đơn và nhiệm vụ trong **một transaction**, mỗi RFQ chỉ có một đơn. Chi tiết ở `04-quotation-flow.md` |
| TECH-04 | Bản đồ có pin theo lat/lng; bấm pin mở popup | Leaflet + OpenStreetMap (BUY-05) |
| TECH-05 | Giao diện image-centric, CSS tự thiết kế, không dùng thư viện có sẵn | **CSS thuần / CSS Modules** với design system riêng (N2-T1-02) |
| TECH-06 | Upload nhiều ảnh và tối ưu kích thước ở backend | Multer + Sharp sinh thumbnail; ảnh được lưu bền vững, xóa ảnh thừa khi thay hoặc xóa (N2-T2-03) |
| TECH-07 *(C)* | "Làng ảo" dạng mê cung để khám phá | Chỉ làm nếu còn thời gian sau tuần 5 |

## 5. Yêu cầu phi chức năng

| Mã | Nhóm | Yêu cầu |
|----|------|---------|
| NFR-01 | Hiệu năng | Danh sách dùng ảnh thumbnail và lazy-load, không bao giờ tải ảnh gốc. API danh sách luôn phân trang. Thử với seed ≥ 200 sản phẩm (N2-T5-06) |
| NFR-02 | Tải từng phần | Gọi API bằng `fetch` + JSON, cập nhật từng phần giao diện, không reload cả trang |
| NFR-03 | Bảo mật | Mật khẩu được băm; cookie phiên `HttpOnly`; có bảo vệ CSRF cho request thay đổi dữ liệu; giới hạn số lần đăng nhập sai (N1-T5-07) |
| NFR-04 | Bảo mật | Server kiểm tra toàn bộ input bằng **Zod**; validation HTML chỉ để hỗ trợ trải nghiệm. Upload kiểm tra **loại tệp thật** (không chỉ đuôi) và dung lượng |
| NFR-05 | Phân quyền | Thử đổi ID trong request phải không xem hay sửa được dữ liệu của Buyer hoặc xưởng khác |
| NFR-06 | Toàn vẹn | Duyệt phương án và tạo đơn chạy trong transaction: lỗi thì rollback, không để lại đơn dang dở; hai request duyệt đồng thời chỉ tạo ra một đơn |
| NFR-07 | Giao diện | Responsive trên mobile, tablet, desktop; form, bảng, dialog thao tác được bằng bàn phím; mọi màn hình có trạng thái loading, rỗng và lỗi |
| NFR-08 | Định tuyến | Refresh `/xuong/:slug`, `/san-pham/:slug`, `/truy-xuat/:maLo` không bị 404 |
| NFR-09 | Khả dụng | Giao diện tiếng Việt; tiền VND; ngày dd/MM/yyyy |
| NFR-10 | Bảo trì | Code tách route → controller → service → repository; Prisma chỉ dùng ở lớp data; có seed và README để chạy lại được |

## 6. Phạm vi

**Trong phạm vi:** các chức năng ở mục 3 và 4.

**Ngoài phạm vi** *(đã thống nhất trong phân công, dùng để trả lời khi vấn đáp)*:
- Thanh toán trực tuyến, giỏ hàng bán lẻ, vận chuyển
- Khóa tài khoản nâng cao (Admin chỉ duyệt hoặc từ chối)
- Hệ thống version cho phương án (mỗi thời điểm chỉ có **một** phương án hiệu lực)
- Dashboard thống kê chuyên sâu; dashboard riêng cho Artisan và Buyer
- Lưu sản phẩm yêu thích
- Đổi mật khẩu *(không bắt buộc)*, email/SMS, thông báo đẩy
- Deploy cloud *(chỉ làm khi cần quét QR ngoài mạng LAN)*
- Tài liệu API riêng

## 7. Giả định

- Mỗi tài khoản Artisan ứng với đúng **một xưởng**. Hệ thống phục vụ **một làng nghề**.
- **Xưởng phù hợp** với một RFQ = xưởng **đã duyệt**, có làm **danh mục** của RFQ và **đang nhận làm** đơn (N3-T1-07).
- Một lô có thể chứa nhiều sản phẩm; các sản phẩm cùng lô dùng **chung một QR**.
- Mỗi RFQ chỉ có tối đa **một phương án đang hiệu lực** và **một đơn hàng**.
- Mỗi xưởng trong phương án đã duyệt nhận một **nhiệm vụ sản xuất**. Xưởng hoàn thành nhiệm vụ của mình không đồng nghĩa với đơn đã xong: đơn chỉ chuyển sang **Delivered** khi Buyer xác nhận đã nhận hàng.
- QR chỉ dùng để **mở dữ liệu truy xuất**, không tự chứng minh sản phẩm là hàng thật.

## 8. Thuật ngữ

| Thuật ngữ | Ý nghĩa |
|-----------|---------|
| Xưởng (Workshop) | Không gian số của một hộ / nghệ nhân |
| Lô sản xuất (ProductionBatch) | Một đợt sản xuất của xưởng, gồm một hoặc nhiều sản phẩm |
| Mã lô (`maLo` / `batchCode`) | Mã duy nhất của lô, được mã hóa trong QR |
| Mốc nhật ký (ProductionMilestone) | Một công đoạn của lô, có thời gian, mô tả và ảnh |
| RFQ | Request for Quotation, yêu cầu báo giá do Buyer tạo |
| Lời mời (Invitation) | Bản ghi cho biết RFQ đã được gửi tới xưởng nào |
| Báo giá (Bid) | Đề xuất số lượng, đơn giá, thời gian của một xưởng cho một RFQ |
| Phương án chia đơn (AllocationPlan) | Cách chia số lượng của RFQ cho các xưởng, do Admin lập dựa trên các báo giá |
| Đơn hàng (Order) | Được tạo khi Buyer chấp nhận phương án |
| Nhiệm vụ sản xuất (ProductionTask) | Phần việc của một xưởng trong một đơn hàng |