// File này làm gì: Cấp mã lô và dọn ảnh sau khi xóa dữ liệu sản xuất.
// Ai gọi file này: Router quản lý lô và mốc nhật ký.
import { randomBytes } from 'node:crypto'
import { AppError } from '../../errors.js'

// Ghép logic sinh mã và dọn tệp với các hàm đọc và ghi đã có ở repository.
export function createBatchService(batches, journal, media) {
  return {
    ...batches,
    // Khi trùng mã, ngắt giao dịch cũ và thử lại với mã khác.
    async create(ownerId, input) {
      for (let attempt = 0; attempt < 4; attempt++) {
        const code = 'BT-' + randomBytes(6).toString('hex').toUpperCase()
        try {
          return await batches.create(ownerId, code, input)
        } catch (error) {
          if (error.code !== 'P2002') throw error
        }
      }
      throw new AppError(409, 'BATCH_CODE_CONFLICT', 'Chưa cấp được mã lô. Hãy thử lại.')
    },
    // Chỉ dọn ảnh sau khi repository xác nhận xóa lô hoặc mốc thành công.
    async removeBatch(ownerId, id) {
      await cleanImages(media, await batches.remove(ownerId, id))
    },
    async removeMilestone(ownerId, id) {
      await cleanImages(media, await journal.remove(ownerId, id))
    },
  }
}

// Dọn cả bản ảnh lớn và thumbnail trong thư mục tải lên.
function cleanImages(media, images) {
  return media.clean(images.flatMap(({ imageUrl, thumbUrl }) => [imageUrl, thumbUrl]))
}
