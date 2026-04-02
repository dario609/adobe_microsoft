import multer from 'multer'
import { BANNER_MAX_BYTES } from '../config.js'

const memory = multer.memoryStorage()

const rasterFilter = (_req, file, cb) => {
  const ok = ['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype)
  if (ok) cb(null, true)
  else cb(new Error('Landing background must be PNG, JPEG, or WebP.'))
}

export const uploadLandingBackground = multer({
  storage: memory,
  limits: { fileSize: BANNER_MAX_BYTES, files: 1 },
  fileFilter: rasterFilter,
}).single('background')
