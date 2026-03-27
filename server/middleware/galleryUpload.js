import multer from 'multer'
import { BANNER_MAX_BYTES } from '../config.js'

const memory = multer.memoryStorage()

const pngFilter = (_req, file, cb) => {
  if (file.mimetype === 'image/png') cb(null, true)
  else cb(new Error('Only PNG files are allowed.'))
}

/** Multiple PNGs for admin gallery (field name: `images`). */
export const uploadGalleryPngs = multer({
  storage: memory,
  limits: { fileSize: BANNER_MAX_BYTES, files: 30 },
  fileFilter: pngFilter,
}).array('images', 30)
