/**
 * Allowed upload types for gallery, banner, experience logo (operators choose in admin).
 * PDF standard vs print share MIME `application/pdf` (operator-facing labels only).
 */

const ALLOWED = {
  'image/png': { ext: 'png', accept: '.png,image/png', label: 'PNG' },
  'image/jpeg': { ext: 'jpg', accept: '.jpg,.jpeg,image/jpeg', label: 'JPEG' },
  'image/webp': { ext: 'webp', accept: '.webp,image/webp', label: 'WebP' },
  'application/pdf-standard': {
    ext: 'pdf',
    accept: '.pdf,application/pdf',
    label: 'PDF (standard)',
    fileMime: 'application/pdf',
  },
  'application/pdf-print': {
    ext: 'pdf',
    accept: '.pdf,application/pdf',
    label: 'PDF (print)',
    fileMime: 'application/pdf',
  },
}

const DEFAULT_MIME = 'image/png'

/** @param {unknown} mime */
export function normalizeContentImageMime(mime) {
  const s = String(mime || '').trim().toLowerCase()
  if (s === 'image/jpg') return 'image/jpeg'
  if (s === 'application/pdf') return 'application/pdf-standard'
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
  const wantKey = normalizeContentImageMime(policyMime)
  const meta = ALLOWED[wantKey]
  if (!meta) return false
  const expected = meta.fileMime || wantKey
  const got = String(fileMime || '').trim().toLowerCase()
  if (got === 'image/jpg') return expected === 'image/jpeg'
  return got === expected
}

/** @param {string} ext — stored file extension */
export function extToMimeType(ext) {
  const e = String(ext || 'png').toLowerCase()
  if (e === 'jpg' || e === 'jpeg') return 'image/jpeg'
  if (e === 'webp') return 'image/webp'
  if (e === 'pdf') return 'application/pdf'
  return 'image/png'
}
