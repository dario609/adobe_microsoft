import multer from 'multer'
import { BANNER_MAX_BYTES } from '../config.js'

const memory = multer.memoryStorage()

export const uploadSessionBanner = multer({
  storage: memory,
  limits: { fileSize: BANNER_MAX_BYTES },
  fileFilter: (_req, _file, cb) => cb(null, true),
}).single('banner')
