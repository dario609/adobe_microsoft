/**
 * Gallery, banner, experience logo, and landing background uploads accept any file type.
 * Stored extension is taken from the original filename when safe, otherwise inferred from MIME.
 */
import path from 'node:path'

const MIME_TO_EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
  'image/bmp': 'bmp',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
  'application/pdf': 'pdf',
}

/** @param {string} ext */
export function sanitizeStoredFileExt(ext) {
  const x = String(ext || 'bin').toLowerCase().replace(/^\./, '')
  if (!/^[a-z0-9]{1,16}$/.test(x)) return 'bin'
  if (x === 'jpeg') return 'jpg'
  return x
}

/**
 * Multer file: { mimetype, originalname }
 * @param {{ mimetype?: string, originalname?: string }} file
 */
export function inferStoredExtFromUpload(file) {
  const name = String(file?.originalname || '')
  let ext = path.extname(name).toLowerCase().replace(/^\./, '')
  if (ext === 'jpeg') ext = 'jpg'
  if (ext) return sanitizeStoredFileExt(ext)

  const mt = String(file?.mimetype || '').trim().toLowerCase()
  if (MIME_TO_EXT[mt]) return MIME_TO_EXT[mt]
  if (mt.startsWith('image/')) {
    const sub = mt.slice(6).replace(/[^a-z0-9]/gi, '').slice(0, 12)
    return sanitizeStoredFileExt(sub || 'img')
  }
  if (mt.startsWith('video/')) {
    const sub = mt.slice(6).replace(/[^a-z0-9]/gi, '').slice(0, 12)
    return sanitizeStoredFileExt(sub || 'vid')
  }
  if (mt.startsWith('audio/')) {
    const sub = mt.slice(6).replace(/[^a-z0-9]/gi, '').slice(0, 12)
    return sanitizeStoredFileExt(sub || 'aud')
  }
  if (mt === 'application/pdf' || mt.endsWith('+json') || mt.startsWith('text/')) {
    if (mt === 'application/pdf') return 'pdf'
    const sub = mt.split('/').pop()?.replace(/[^a-z0-9]/gi, '').slice(0, 12)
    return sanitizeStoredFileExt(sub || 'dat')
  }
  return 'bin'
}

/** @param {string} ext — stored file extension (no dot) */
export function extToMimeType(ext) {
  const e = sanitizeStoredFileExt(ext)
  const table = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    avif: 'image/avif',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
    pdf: 'application/pdf',
    json: 'application/json',
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
  }
  if (table[e]) return table[e]
  return 'application/octet-stream'
}
