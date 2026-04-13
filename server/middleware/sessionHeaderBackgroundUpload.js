import multer from 'multer'
import { BANNER_MAX_BYTES } from '../config.js'

const memory = multer.memoryStorage()

export const uploadSessionHeaderBackground = multer({
  storage: memory,
  limits: { fileSize: BANNER_MAX_BYTES, files: 1 },
  fileFilter: (_req, _file, cb) => cb(null, true),
}).single('sessionHeaderBackground')
