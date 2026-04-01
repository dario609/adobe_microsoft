import multer from 'multer'
import { BANNER_MAX_BYTES } from '../config.js'
import { mimeMatchesContentPolicy } from '../utils/contentImageConfig.js'
import { getPublicContentSettings } from '../utils/publicConfig.js'

const memory = multer.memoryStorage()

function logoFileFilter(_req, file, cb) {
  const { contentImageMime, contentImageLabel } = getPublicContentSettings()
  if (mimeMatchesContentPolicy(file.mimetype, contentImageMime)) cb(null, true)
  else cb(new Error(`Logo must be ${contentImageLabel} (${contentImageMime}).`))
}

export const uploadExperienceLogo = multer({
  storage: memory,
  limits: { fileSize: BANNER_MAX_BYTES, files: 1 },
  fileFilter: logoFileFilter,
}).single('logo')
