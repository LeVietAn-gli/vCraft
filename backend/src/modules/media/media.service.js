import { randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import multer from 'multer'
import sharp from 'sharp'
import { AppError } from '../../errors.js'

const imageFormat = new Set(['jpeg', 'png', 'webp'])
const invalidImage = () =>
  new AppError(415, 'UNSUPPORTED_FILE', 'Chọn ảnh JPEG, PNG hoặc WebP tĩnh hợp lệ.')
export const imageName = /^[a-f0-9-]{36}(?:_thumb)?\.webp$/

export function createMedia(directory, maxMb) {
  const staging = join(directory, '.staging')
  const uploader = multer({
    storage: multer.diskStorage({
      destination: (req, _file, done) => done(null, req.staging),
      filename: (_req, _file, done) => done(null, randomUUID()),
    }),
    limits: { fileSize: maxMb * 1024 * 1024, files: 10, fields: 12, fieldSize: 4096, parts: 24 },
  })

  function receive(certificate, handler) {
    const parse = certificate ? uploader.single('file') : uploader.array('images', 10)
    return async (req, res) => {
      await mkdir(staging, { recursive: true, mode: 0o700 })
      req.staging = await mkdtemp(join(staging, 'request-'))
      try {
        await new Promise((resolve, reject) =>
          parse(req, res, (error) => (error ? reject(error) : resolve())),
        )
        await handler(req, res)
      } finally {
        await rm(req.staging, { recursive: true, force: true }).catch((error) =>
          console.error({ code: error.code }),
        )
      }
    }
  }

  const filename = (url) => join(directory, url.slice('/uploads/'.length))
  async function clean(urls) {
    for (const url of urls) {
      if (typeof url === 'string' && url.startsWith('/uploads/') && imageName.test(url.slice(9))) {
        await rm(filename(url), { force: true }).catch((error) =>
          console.error({ code: error.code }),
        )
      }
    }
  }

  async function upload(files, { certificate = false } = {}, persist) {
    if (!files.length) throw new AppError(400, 'VALIDATION_ERROR', 'Chọn ít nhất một ảnh.')
    const written = []
    const output = []
    try {
      for (const file of files) {
        const source = sharp(file.path, { failOn: 'warning', limitInputPixels: 24_000_000 })
        const metadata = await source.metadata().catch(() => null)
        if (!metadata || !imageFormat.has(metadata.format) || (metadata.pages ?? 1) !== 1)
          throw invalidImage()
        const stem = '/uploads/' + randomUUID()
        const imageUrl = stem + '.webp'
        const thumbUrl = certificate ? null : stem + '_thumb.webp'
        for (const [url, width] of [
          [imageUrl, 1600],
          [thumbUrl, 400],
        ]) {
          if (!url) continue
          written.push(url)
          await source
            .clone()
            .rotate()
            .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: width === 400 ? 75 : 84 })
            .timeout({ seconds: 20 })
            .toFile(filename(url))
            .catch((error) => {
              if (['ENOSPC', 'EACCES', 'EIO'].includes(error.code)) throw error
              throw invalidImage()
            })
        }
        output.push({ imageUrl, thumbUrl })
      }
      return await persist(output)
    } catch (error) {
      await clean(written)
      throw error
    }
  }

  return { receive, upload, clean, filename, maxUploadMb: maxMb }
}
