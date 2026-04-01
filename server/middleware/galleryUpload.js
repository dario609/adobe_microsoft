import multer from 'multer'
import { BANNER_MAX_BYTES } from '../config.js'
import { mimeMatchesContentPolicy } from '../utils/contentImageConfig.js'
import { getPublicContentSettings } from '../utils/publicConfig.js'

const memory = multer.memoryStorage()

function galleryFileFilter(_req, file, cb) {
  const { contentImageMime, contentImageLabel } = getPublicContentSettings()
  if (mimeMatchesContentPolicy(file.mimetype, contentImageMime)) cb(null, true)
  else cb(new Error(`Only ${contentImageLabel} images (${contentImageMime}) are allowed.`))
}

/** Multiple images for admin gallery (field name: `images`). Type is set in admin / env. */
export const uploadGalleryPngs = multer({
  storage: memory,
  limits: { fileSize: BANNER_MAX_BYTES, files: 30 },
  fileFilter: galleryFileFilter,
}).array('images', 30)

/** Single image replace for gallery (field name: `image`). */
export const uploadGalleryPngSingle = multer({
  storage: memory,
  limits: { fileSize: BANNER_MAX_BYTES, files: 1 },
  fileFilter: galleryFileFilter,
}).single('image')
