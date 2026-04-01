import multer from 'multer'
import { BANNER_MAX_BYTES } from '../config.js'
import { mimeMatchesContentPolicy } from '../utils/contentImageConfig.js'
import { getPublicContentSettings } from '../utils/publicConfig.js'

const memory = multer.memoryStorage()

function bannerFileFilter(_req, file, cb) {
  const { contentImageMime, contentImageLabel } = getPublicContentSettings()
  if (mimeMatchesContentPolicy(file.mimetype, contentImageMime)) cb(null, true)
  else cb(new Error(`Only ${contentImageLabel} images (${contentImageMime}) are allowed for the session banner.`))
}

export const uploadSessionBanner = multer({
  storage: memory,
  limits: { fileSize: BANNER_MAX_BYTES },
  fileFilter: bannerFileFilter,
}).single('banner')
