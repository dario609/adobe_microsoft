/**
 * Client-side check that a File matches the server content policy (mirrors multer).
 * @param {File} file
 * @param {string} contentImageMime — from GET /api/config
 */
export function fileMatchesContentPolicy(file, contentImageMime) {
  if (!file) return false
  const got = String(file.type || '').trim().toLowerCase()
  const policy = String(contentImageMime || '').trim().toLowerCase()

  if (policy === 'application/pdf-standard' || policy === 'application/pdf-print') {
    return got === 'application/pdf'
  }
  if (policy === 'image/jpeg') return got === 'image/jpeg' || got === 'image/jpg'
  if (policy === 'image/webp') return got === 'image/webp'
  if (policy === 'image/png') return got === 'image/png'
  return false
}
