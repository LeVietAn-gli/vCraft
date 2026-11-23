import { ZodError } from 'zod'

export class AppError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Kiểm tra lại các trường đã nhập.',
        details: error.issues.map(({ path, message }) => ({ field: path.join('.'), message })),
      },
    })
  }
  if (error.name === 'MulterError') {
    error =
      error.code === 'LIMIT_FILE_SIZE'
        ? new AppError(413, 'FILE_TOO_LARGE', 'Ảnh vượt quá giới hạn dung lượng.')
        : new AppError(400, 'VALIDATION_ERROR', 'Kiểm tra tên trường và số lượng tệp.')
  }
  if (error.type === 'entity.parse.failed')
    error = new AppError(400, 'VALIDATION_ERROR', 'JSON không hợp lệ.')
  if (error.type === 'entity.too.large')
    error = new AppError(413, 'BODY_TOO_LARGE', 'Nội dung quá lớn.')
  if (error.code === 'P2003') error = new AppError(409, 'IN_USE', 'Dữ liệu đang được sử dụng.')
  if (!(error instanceof AppError)) {
    console.error({ path: req.path, code: error.code ?? error.name })
    error = new AppError(500, 'INTERNAL_ERROR', 'Máy chủ gặp lỗi. Hãy thử lại.')
  }
  res.status(error.status).json({ error: { code: error.code, message: error.message } })
}

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    req.validated ??= {}
    req.validated[source] = schema.parse(req[source] ?? {})
    next()
  }
}
