import multer from 'multer'
import { BANNER_MAX_BYTES } from '../config.js'

const memory = multer.memoryStorage()

function allowAll(_req, _file, cb) {
  cb(null, true)
}

/** Multiple images for admin gallery (field name: `images`). */
export const uploadGalleryPngs = multer({
  storage: memory,
  limits: { fileSize: BANNER_MAX_BYTES, files: 30 },
  fileFilter: allowAll,
}).array('images', 30)

/** Single image replace for gallery (field name: `image`). */
export const uploadGalleryPngSingle = multer({
  storage: memory,
  limits: { fileSize: BANNER_MAX_BYTES, files: 1 },
  fileFilter: allowAll,
}).single('image')
