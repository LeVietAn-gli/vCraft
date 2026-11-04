# 05 — Hợp đồng API (API Contract)

Bản chốt **N1-T1-03**: quy ước chung và danh sách endpoint để ba thành viên làm frontend và backend song song. Đây là **hợp đồng ngắn**, không thay thế việc đọc source khi vấn đáp, và nhóm không làm Swagger.

Tên field trong JSON trùng tên cột trong `03-database.md` (camelCase). Chi tiết state machine, điều kiện chuyển trạng thái và mã lỗi nghiệp vụ của luồng báo giá xem `04-quotation-flow.md`.

---

## 1. Quy ước chung

### 1.1. Request

| Mục | Quy ước |
|-----|---------|
| Base URL | `/api` (cùng origin với frontend; khi dev, Vite proxy chuyển `/api` sang Express) |
| Định dạng | `Content-Type: application/json`, riêng upload dùng `multipart/form-data` |
| Xác thực | Cookie phiên `HttpOnly`, trình duyệt tự gửi. `fetch` dùng `credentials: 'same-origin'` (mặc định) |
| CSRF | Mọi `POST/PUT/PATCH/DELETE` phải có header `Origin` trùng với `APP_PUBLIC_URL` (trình duyệt tự gửi header này) |
| Validate | Mọi body, query, params đều qua Zod |
| Thời gian | ISO 8601 UTC, ví dụ `"2026-11-20T03:00:00.000Z"`. Field kiểu `date` dùng dạng `"2026-12-15"` |
| Tiền | `decimal(12,2)` được trả về dưới dạng **chuỗi**, ví dụ `"45000.00"`. Client gửi số hoặc chuỗi |
| ID | uuid; trang public dùng `slug` hoặc `batchCode` thay cho id |

### 1.2. Response

**Một đối tượng:**
```json
{ "data": { "id": "…", "name": "…" } }
```

**Danh sách** (query `?page=1&limit=20&sort=-createdAt&q=…`; `limit` tối đa 50; dấu `-` là giảm dần):
```json
{
  "data": [ { "…": "…" } ],
  "meta": { "page": 1, "limit": 20, "total": 134, "totalPages": 7 }
}
```

**Lỗi:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": [ { "field": "quantity", "message": "Phải là số nguyên dương" } ]
  }
}
```

| HTTP | Khi nào | `code` thường gặp |
|------|---------|-------------------|
| 400 | Dữ liệu sai | `VALIDATION_ERROR` |
| 401 | Chưa đăng nhập hoặc phiên hết hạn | `UNAUTHENTICATED` |
| 403 | Sai vai trò, xưởng chưa duyệt, sai `Origin` | `FORBIDDEN`, `WORKSHOP_NOT_APPROVED`, `CSRF_REJECTED` |
| 404 | Không tồn tại **hoặc không có quyền xem** | `*_NOT_FOUND` |
| 409 | Xung đột trạng thái, dữ liệu trùng, còn liên kết | `INVALID_TRANSITION`, `EMAIL_TAKEN`, `IN_USE`… |
| 413 | File quá lớn | `FILE_TOO_LARGE` |
| 415 | Không phải ảnh hợp lệ | `UNSUPPORTED_FILE` |
| 422 | Đúng định dạng nhưng không thực hiện được | `NO_MATCHING_WORKSHOP` |
| 429 | Đăng nhập sai quá nhiều lần | `TOO_MANY_ATTEMPTS` |
| 500 | Lỗi không lường trước (không lộ stack trace) | `INTERNAL_ERROR` |

### 1.3. Ký hiệu quyền trong bảng endpoint

`Public` = ai cũng gọi được · `Auth` = đã đăng nhập · `B` = Buyer · `A` = Artisan (xưởng `APPROVED`, trừ khi ghi chú khác) · `AD` = Admin · `Chủ` = chỉ chủ sở hữu tài nguyên.

## 2. Tài khoản và phiên (N1)

| Method | Path | Quyền | Mô tả |
|--------|------|-------|-------|
| POST | `/api/auth/register` | Public | Đăng ký Buyer hoặc Artisan. Artisan được tạo kèm `Workshop` ở trạng thái `PENDING` |
| POST | `/api/auth/login` | Public | Tạo phiên, giới hạn số lần thử |
| POST | `/api/auth/logout` | Auth | Hủy phiên |
| GET | `/api/auth/me` | Auth | Người dùng hiện tại; Artisan có kèm `workshop` tóm tắt |

```jsonc
// POST /api/auth/register
{
  "role": "ARTISAN",                    // "BUYER" | "ARTISAN"
  "email": "minhduc@example.com",
  "password": "********",               // tối thiểu 8 ký tự
  "fullName": "Nguyễn Minh Đức",
  "phone": "0912345678",
  "workshop": {                         // chỉ khi role = ARTISAN
    "name": "Xưởng gốm Minh Đức",
    "address": "Xóm 3, Bát Tràng, Gia Lâm, Hà Nội",
    "categoryIds": ["…"]
  }
}
// 201 → { "data": { "id": "…", "role": "ARTISAN", "workshop": { "id": "…", "status": "PENDING" } } }
// 409 EMAIL_TAKEN
```

```jsonc
// GET /api/auth/me → 200
{ "data": { "id": "…", "email": "…", "fullName": "…", "role": "ARTISAN",
            "workshop": { "id": "…", "slug": "xuong-gom-minh-duc", "status": "APPROVED" } } }
// 401 khi chưa đăng nhập → frontend coi là khách
```

## 3. Danh mục (N2)

| Method | Path | Quyền | Mô tả |
|--------|------|-------|-------|
| GET | `/api/categories` | Public | Toàn bộ danh mục (không phân trang) |
| POST · PATCH · DELETE | `/api/admin/categories[/:id]` | AD | Quản lý danh mục *(S)*. Xóa danh mục đang được dùng → 409 `IN_USE` |

## 4. Xưởng (N2)

### 4.1. Public

| Method | Path | Quyền | Mô tả |
|--------|------|-------|-------|
| GET | `/api/workshops?q=&categoryId=&isOpenForVisit=&page=` | Public | Danh sách xưởng `APPROVED` |
| GET | `/api/workshops/suggest?q=` | Public | Autocomplete, tối đa 8 kết quả `{ slug, name, thumbUrl }` |
| GET | `/api/workshops/map?isOpenForVisit=` | Public | Dữ liệu rút gọn cho bản đồ (không phân trang) |
| GET | `/api/workshops/:slug` | Public | Hồ sơ đầy đủ: ảnh, chứng nhận, danh mục, các lô công khai |

```jsonc
// GET /api/workshops/map → 200
{ "data": [ {
  "slug": "xuong-gom-minh-duc", "name": "Xưởng gốm Minh Đức",
  "latitude": "21.003870", "longitude": "105.913220",
  "thumbUrl": "/uploads/w/…_thumb.webp",
  "isOpenForVisit": true,
  "openingHours": { "mon": [["08:00","17:00"]], "sun": [] },
  "categories": ["Bình hoa", "Ấm chén"]
} ] }
```

### 4.2. Artisan quản lý xưởng của mình

`/api/me/workshop` luôn là xưởng của người đang đăng nhập, client không gửi id xưởng. Các API ở mục này cho phép cả xưởng `PENDING`, để Artisan hoàn thiện hồ sơ trong lúc chờ duyệt.

| Method | Path | Quyền | Mô tả |
|--------|------|-------|-------|
| GET | `/api/me/workshop` | A (cả `PENDING`) | Hồ sơ, gồm `status` và `rejectionReason` |
| PATCH | `/api/me/workshop` | A (cả `PENDING`) | Sửa thông tin, tọa độ, giờ mở cửa, `isOpenForVisit`, `acceptsOrders`, `categoryIds` |
| POST | `/api/me/workshop/images` | A (cả `PENDING`) | Upload ảnh xưởng (mục 9) |
| PATCH | `/api/me/workshop/images/order` | A | Body `{ "ids": ["…", "…"] }` theo thứ tự mới |
| DELETE | `/api/me/workshop/images/:imageId` | A | Xóa bản ghi và file |
| POST | `/api/me/workshop/certificates` | A (cả `PENDING`) | Multipart: `file` + `title`, `issuer`, `issuedAt?` |
| DELETE | `/api/me/workshop/certificates/:id` | A | |

## 5. Sản phẩm (N2)

| Method | Path | Quyền | Mô tả |
|--------|------|-------|-------|
| GET | `/api/products?q=&categoryId=&workshop=<slug>&minPrice=&maxPrice=&sort=&page=` | Public | Catalog: chỉ sản phẩm `VISIBLE` của xưởng `APPROVED`; mỗi item chỉ kèm ảnh `isPrimary` (`thumbUrl`) |
| GET | `/api/products/:slug` | Public | Chi tiết: gallery, xưởng, các lô công khai chứa sản phẩm |
| GET | `/api/me/products?status=&page=` | A | Sản phẩm của xưởng mình (gồm cả `HIDDEN`) |
| POST | `/api/me/products` | A | Tạo sản phẩm (mặc định `HIDDEN`); server sinh `slug` |
| PATCH | `/api/me/products/:id` | A, Chủ | Sửa, đổi `status` |
| DELETE | `/api/me/products/:id` | A, Chủ | 409 `IN_USE` nếu sản phẩm đã nằm trong lô; khi đó chuyển sang `HIDDEN` |
| POST | `/api/me/products/:id/images` | A, Chủ | Upload ảnh (mục 9) |
| PATCH | `/api/me/products/:id/images/order` | A, Chủ | Sắp xếp |
| PATCH | `/api/me/products/:id/images/:imageId/primary` | A, Chủ | Đặt làm ảnh đại diện |
| DELETE | `/api/me/products/:id/images/:imageId` | A, Chủ | |

```jsonc
// POST /api/me/products
{
  "name": "Bình hoa men lam vẽ sen",
  "categoryId": "…",                  // phải thuộc danh mục của xưởng
  "description": "…",
  "specifications": { "chatLieu": "Đất sét trắng", "kichThuoc": "Cao 35cm" },
  "price": 850000                     // null = liên hệ báo giá
}
// 201 → { "data": { "id": "…", "slug": "binh-hoa-men-lam-ve-sen", "status": "HIDDEN" } }
```

Muốn chuyển sản phẩm sang `VISIBLE` thì sản phẩm phải có ít nhất một ảnh; nếu chưa có, server trả 409 `NO_IMAGE`.

## 6. Lô sản xuất, nhật ký, QR (N2)

| Method | Path | Quyền | Mô tả |
|--------|------|-------|-------|
| GET | `/api/me/batches?status=&page=` | A | Danh sách lô của xưởng mình |
| POST | `/api/me/batches` | A | Tạo lô; server sinh `batchCode` |
| GET | `/api/me/batches/:id` | A, Chủ | Chi tiết: sản phẩm, mốc, ảnh |
| PATCH | `/api/me/batches/:id` | A, Chủ | Sửa `name`, `description`, `status`, `isPublic`, `products` |
| DELETE | `/api/me/batches/:id` | A, Chủ | Chỉ xóa được lô `PLANNED` và chưa công khai, nếu không thì 409 |
| GET | `/api/me/batches/:id/qr?format=png\|svg&size=` | A, Chủ | Ảnh QR chứa `APP_PUBLIC_URL/truy-xuat/:batchCode` (sinh mỗi lần gọi, không lưu) |
| POST | `/api/me/batches/:id/milestones` | A, Chủ | Thêm mốc |
| PATCH | `/api/me/milestones/:id` | A, Chủ | Sửa mốc |
| DELETE | `/api/me/milestones/:id` | A, Chủ | Xóa mốc, ảnh của mốc và file trên đĩa |
| PATCH | `/api/me/batches/:id/milestones/order` | A, Chủ | Body `{ "ids": [...] }`; cập nhật `orderIndex` bằng hai bước (`03-database.md`, mục 4.4) |
| POST | `/api/me/milestones/:id/images` | A, Chủ | Upload ảnh minh chứng |
| DELETE | `/api/me/milestones/:id/images/:imageId` | A, Chủ | |

```jsonc
// POST /api/me/batches
{
  "name": "Lô bình men lam tháng 11/2026",
  "description": "…",
  "products": [ { "productId": "…", "quantity": 20 }, { "productId": "…", "quantity": 12 } ]
}
// 201 → { "data": { "id": "…", "batchCode": "BT7K2QX9", "status": "PLANNED", "isPublic": false } }
// 400 PRODUCT_NOT_IN_WORKSHOP nếu có sản phẩm của xưởng khác

// POST /api/me/batches/:id/milestones
{ "title": "Nung lò", "description": "Nung 1.300°C trong 12 giờ", "occurredAt": "2026-11-10T01:00:00.000Z" }
// server tự gán orderIndex = cuối danh sách và updatedById = người đang đăng nhập
```

Khi đổi `status` của lô, server tự đặt `startedAt` (lúc chuyển sang `IN_PROGRESS`) và `completedAt` (lúc chuyển sang `COMPLETED`).

### 6.1. Truy xuất công khai (N2 API, N1 trang)

| Method | Path | Quyền | Mô tả |
|--------|------|-------|-------|
| GET | `/api/trace/:batchCode` | Public | Toàn bộ dữ liệu cho trang `/truy-xuat/:maLo` trong một lần gọi |

```jsonc
// GET /api/trace/BT7K2QX9 → 200
{ "data": {
  "batchCode": "BT7K2QX9",
  "name": "Lô bình men lam tháng 11/2026",
  "description": "…",
  "status": "COMPLETED",                   // "CANCELLED" → giao diện hiện nhãn "Đã hủy"
  "startedAt": "…", "completedAt": "…",
  "workshop": { "slug": "xuong-gom-minh-duc", "name": "…", "address": "…", "thumbUrl": "…" },
  "products": [ { "slug": "…", "name": "…", "quantity": 20, "thumbUrl": "…" } ],
  "milestones": [
    { "orderIndex": 0, "title": "Nhào đất", "description": "…", "occurredAt": "…",
      "images": [ { "imageUrl": "…", "thumbUrl": "…", "altText": "…" } ] },
    { "orderIndex": 1, "title": "Vuốt cốt", "description": null, "occurredAt": null, "images": [] }
  ]
} }
// 404 BATCH_NOT_FOUND khi mã sai, isPublic = false, hoặc xưởng không APPROVED
```

API không trả `id` nội bộ, `updatedById` hay dữ liệu đơn hàng. Chỉ kèm sản phẩm `VISIBLE`. Mốc thiếu dữ liệu được trả về `null`, server không tự điền.

## 7. RFQ, lời mời, báo giá, phương án, đơn, nhiệm vụ

Điều kiện và mã lỗi chi tiết của từng bước nằm ở `04-quotation-flow.md`, mục 2–10. Dưới đây là danh sách endpoint và request mẫu.

| Method | Path | Quyền | Phụ trách |
|--------|------|-------|-----------|
| POST | `/api/rfqs` | B | N1 |
| GET | `/api/rfqs?status=&page=` | B (của mình), AD (tất cả) | N1 |
| GET | `/api/rfqs/:id` | B Chủ, AD, A có lời mời | N1 |
| PATCH | `/api/rfqs/:id` | B Chủ | N1 |
| POST | `/api/rfqs/:id/send` | B Chủ | N1 + N3 |
| GET | `/api/invitations?status=&page=` | A | N3 |
| GET | `/api/invitations/:id` | A Chủ | N3 |
| PUT | `/api/rfqs/:id/bids/mine` | A có lời mời | N3 |
| GET | `/api/rfqs/:id/bids` | B Chủ, AD | N3 |
| POST | `/api/rfqs/:id/plans` | AD | N3 |
| PUT | `/api/plans/:id/items` | AD | N3 |
| POST | `/api/plans/:id/send` | AD | N3 |
| GET | `/api/rfqs/:id/plans/current` | B Chủ, AD | N3 |
| POST | `/api/plans/:id/accept` | B Chủ | N1 |
| POST | `/api/plans/:id/reject` | B Chủ | N1 + N3 |
| GET | `/api/orders?status=&page=` | B (của mình), AD (tất cả) | N1, N3 |
| GET | `/api/orders/:id` | B Chủ, AD | N1 |
| POST | `/api/orders/:id/confirm-received` | B Chủ | N1 |
| GET | `/api/tasks?status=&page=` | A | N2 |
| GET | `/api/tasks/:id` | A Chủ | N2 |
| PATCH | `/api/tasks/:id/progress` | A Chủ | N2 |

```jsonc
// POST /api/rfqs   (contactName/contactPhone bỏ trống → server tự điền từ User)
{
  "title": "5.000 cốc in logo ĐH Công nghệ",
  "categoryId": "…",
  "referenceProductId": "…",           // tùy chọn, khi tạo từ trang sản phẩm
  "description": "Cốc sứ trắng 300ml, in logo 2 màu",
  "quantity": 5000, "unit": "chiếc",
  "budgetMax": 250000000,
  "bidDeadline": "2026-11-20T10:00:00.000Z",
  "requiredBy": "2026-12-15",
  "deliveryAddress": "144 Xuân Thủy, Cầu Giấy, Hà Nội"
}
// 201 → { "data": { "id": "…", "code": "RFQ-2026-0012", "status": "DRAFT" } }

// POST /api/rfqs/:id/send → 200
{ "data": { "id": "…", "status": "SENT", "invitedCount": 4 } }
// 422 NO_MATCHING_WORKSHOP

// PUT /api/rfqs/:id/bids/mine
{ "quantityOffered": 2000, "unitPrice": 42000, "leadTimeDays": 21, "note": "In lụa thủ công" }
// 200 (sửa) | 201 (tạo mới) → { "data": { "id": "…", "status": "SUBMITTED", "lineTotal": "84000000.00" } }

// PUT /api/plans/:id/items   (chỉ gửi bidId và quantity; giá do server chép từ bid)
{ "items": [
  { "bidId": "…", "quantity": 2000, "dueDate": "2026-12-10" },
  { "bidId": "…", "quantity": 1800, "dueDate": "2026-12-10" },
  { "bidId": "…", "quantity": 1200, "dueDate": "2026-12-12" }
] }
// 200 → { "data": { "status": "DRAFT", "totalQuantity": 5000, "totalAmount": "212400000.00", "items": [ … ] } }

// POST /api/plans/:id/accept → 201 (lần đầu) | 200 (gọi lặp)
{ "data": { "order": { "id": "…", "code": "ORD-2026-0007", "status": "IN_PRODUCTION" },
            "alreadyProcessed": false } }

// POST /api/plans/:id/reject
{ "reason": "Hạn giao của xưởng thứ 3 quá sát" }  // tùy chọn

// PATCH /api/tasks/:id/progress
{ "status": "IN_PROGRESS", "completedQuantity": 800, "progressNote": "Đã nung xong mẻ 1" }
```

```jsonc
// GET /api/orders/:id → 200 (Buyer)
{ "data": {
  "id": "…", "code": "ORD-2026-0007", "status": "IN_PRODUCTION", "totalAmount": "212400000.00",
  "progress": { "completedQuantity": 1400, "quantity": 5000 },   // toàn đơn, server tính
  "tasks": [
    { "workshop": { "slug": "…", "name": "…" }, "quantity": 2000, "completedQuantity": 800,
      "status": "IN_PROGRESS", "dueDate": "2026-12-10", "progressNote": "…" }
  ]
} }
```

## 8. Tin cộng đồng (N3)

| Method | Path | Quyền | Mô tả |
|--------|------|-------|-------|
| GET | `/api/news?category=&featured=&page=` | Public | Chỉ bài `PUBLISHED`; `category` ∈ `MATERIAL_PRICE`, `POWER_OUTAGE`, `SUPPORT_POLICY` |
| GET | `/api/news/:slug` | Public | |
| GET | `/api/admin/news?status=&category=&page=` | AD | Gồm cả bài nháp |
| POST | `/api/admin/news` | AD | Tạo bài (mặc định `DRAFT`) |
| PATCH | `/api/admin/news/:id` | AD | Sửa; `status: "PUBLISHED"` để đăng (server đặt `publishedAt`) |
| DELETE | `/api/admin/news/:id` | AD | |
| POST | `/api/admin/news/:id/cover` | AD | Upload ảnh bìa (tùy chọn) |

## 9. Quản trị (N3)

| Method | Path | Quyền | Mô tả |
|--------|------|-------|-------|
| GET | `/api/admin/dashboard` | AD | `{ pendingWorkshops, activeRfqs, ordersInProduction }` |
| GET | `/api/admin/workshops?status=PENDING&page=` | AD | Hồ sơ chờ duyệt, kèm chứng nhận |
| GET | `/api/admin/workshops/:id` | AD | Chi tiết hồ sơ |
| POST | `/api/admin/workshops/:id/approve` | AD | `PENDING → APPROVED`; ghi `reviewedById`, `reviewedAt` |
| POST | `/api/admin/workshops/:id/reject` | AD | Body `{ "reason": "…" }` (bắt buộc) |
| POST | `/api/admin/rfqs/:id/invitations` | AD | Mời thêm xưởng thủ công *(C)*: `{ "workshopIds": [...] }` |

## 10. Upload ảnh (N2, dùng chung)

Mọi API upload đều theo cùng một quy ước:

| Mục | Quy ước |
|-----|---------|
| Body | `multipart/form-data`, field `images` (nhiều file), riêng chứng nhận dùng field `file` (một file). Có thể gửi kèm `altText[]` |
| Giới hạn | Tối đa 10 file mỗi lần, mỗi file ≤ `MAX_UPLOAD_MB` |
| Loại tệp | JPEG, PNG, WebP. Loại tệp được xác định bằng Sharp, không tin đuôi file hay `mimetype` → sai thì 415 `UNSUPPORTED_FILE` |
| Xử lý | Sharp xoay ảnh theo EXIF, bỏ metadata, sinh `imageUrl` (rộng tối đa 1600px) và `thumbUrl` (rộng tối đa 400px), định dạng WebP |
| Tính nguyên tử | Nếu một file trong lô upload lỗi thì toàn bộ request thất bại, và các file đã ghi ra đĩa trong request đó bị xóa |
| Response | `201 { "data": [ { "id", "imageUrl", "thumbUrl", "altText", "sortOrder" } ] }` |

Ảnh được gắn **trực tiếp vào tài nguyên sở hữu nó** (sản phẩm, mốc, xưởng), nên không có ảnh "mồ côi". Form tạo sản phẩm và tạo mốc vì vậy theo thứ tự: tạo bản ghi trước, upload ảnh sau.

## 11. Quy ước phía frontend

```js
// api/client.js — gọi API qua một hàm duy nhất
export async function apiFetch(path, { method = 'GET', body, signal } = {}) {
  const isForm = body instanceof FormData;
  const res = await fetch(`/api${path}`, {
    method, signal,
    headers: isForm || !body ? undefined : { 'Content-Type': 'application/json' },
    body: isForm ? body : body && JSON.stringify(body),
  });
  if (res.status === 204) return null;
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) redirectToLogin();       // giữ lại ?next=<trang hiện tại>
    throw new ApiError(res.status, json?.error);     // không bao giờ "nuốt" lỗi
  }
  return json;
}
```

- Mỗi màn hình hiển thị đủ 3 trạng thái **loading / empty / error**; trạng thái error có nút "Thử lại" (N1-T5-06).
- Lỗi mạng (`fetch` ném `TypeError`) được hiển thị là "Không kết nối được máy chủ", không báo thành công giả.
- Lỗi `VALIDATION_ERROR` được hiển thị cạnh từng trường dựa vào `details[].field`.