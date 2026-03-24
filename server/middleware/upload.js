import multer from 'multer'
import { MAX_UPLOAD_BYTES } from '../config.js'

const memory = multer.memoryStorage()

export const uploadSingleDesign = multer({
  storage: memory,
  limits: { fileSize: MAX_UPLOAD_BYTES },
}).single('file')
