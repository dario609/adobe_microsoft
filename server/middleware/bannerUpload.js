import multer from 'multer'
import { BANNER_MAX_BYTES } from '../config.js'

const memory = multer.memoryStorage()

export const uploadSessionBanner = multer({
  storage: memory,
  limits: { fileSize: BANNER_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'image/png') {
      cb(null, true)
    } else {
      cb(new Error('Only PNG is allowed for the session banner.'))
    }
  },
}).single('banner')
