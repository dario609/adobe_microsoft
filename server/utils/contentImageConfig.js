/** Single allowed image type for gallery + session banner uploads (operators choose in admin). */

const ALLOWED = /** @type {const} */ ({
  'image/png': { ext: 'png', accept: '.png,image/png', label: 'PNG' },
  'image/jpeg': { ext: 'jpg', accept: '.jpg,.jpeg,image/jpeg', label: 'JPEG' },
  'image/webp': { ext: 'webp', accept: '.webp,image/webp', label: 'WebP' },
})

const DEFAULT_MIME = 'image/png'

/** @param {unknown} mime */
export function normalizeContentImageMime(mime) {
  const s = String(mime || '').trim().toLowerCase()
  if (s === 'image/jpg') return 'image/jpeg'
  if (Object.prototype.hasOwnProperty.call(ALLOWED, s)) return s
  return DEFAULT_MIME
}

export function getAllowedContentImageMimes() {
  return Object.keys(ALLOWED)
}

/** Env fallback when runtime override is null */
export function getContentImageMimeFromEnv() {
  const raw = process.env.CONTENT_IMAGE_MIME?.trim() || process.env.GALLERY_IMAGE_MIME?.trim() || ''
  return normalizeContentImageMime(raw || DEFAULT_MIME)
}

/**
 * @param {string | null | undefined} overrideMime — from runtime-config.json
 */
export function resolveContentImageMime(overrideMime) {
  if (overrideMime != null && String(overrideMime).trim() !== '') {
    return normalizeContentImageMime(overrideMime)
  }
  return getContentImageMimeFromEnv()
}

export function contentImageMeta(mime) {
  const m = normalizeContentImageMime(mime)
  return ALLOWED[m] || ALLOWED[DEFAULT_MIME]
}

export function mimeMatchesContentPolicy(fileMime, policyMime) {
  const want = normalizeContentImageMime(policyMime)
  const got = String(fileMime || '').trim().toLowerCase()
  if (got === 'image/jpg') return want === 'image/jpeg'
  return got === want
}

/** @param {string} ext — stored file extension (png, jpg, webp) */
export function extToMimeType(ext) {
  const e = String(ext || 'png').toLowerCase()
  if (e === 'jpg' || e === 'jpeg') return 'image/jpeg'
  if (e === 'webp') return 'image/webp'
  return 'image/png'
}
