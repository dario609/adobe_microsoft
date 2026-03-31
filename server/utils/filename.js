const IMAGE_EXT = /\.(png|jpg|jpeg|webp)$/i

/** Max length of the client-provided name (before safeFilename rules). Matches safeFilename slice cap. */
export const MAX_UPLOAD_FILENAME_CHARS = 180

/**
 * Reject empty/whitespace-only or overlong display names (abuse / bad clients).
 * @param {unknown} raw
 * @returns {{ ok: true } | { ok: false, code: string, message: string }}
 */
export function validateUploadFilenameField(raw) {
  if (raw == null) {
    return { ok: false, code: 'FILENAME_EMPTY', message: 'filename is required.' }
  }
  const s = String(raw).trim()
  if (!s) {
    return { ok: false, code: 'FILENAME_EMPTY', message: 'filename cannot be empty or whitespace-only.' }
  }
  if (s.length > MAX_UPLOAD_FILENAME_CHARS) {
    return {
      ok: false,
      code: 'FILENAME_TOO_LONG',
      message: `filename must be at most ${MAX_UPLOAD_FILENAME_CHARS} characters.`,
    }
  }
  return { ok: true }
}

export function safeFilename(name) {
  const base = String(name || 'design')
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 180)
  return base || 'design'
}

export function ensureImageExtension(filename) {
  if (IMAGE_EXT.test(filename)) return filename
  return `${filename}.png`
}

/** Dropbox path: optional DROPBOX_UPLOAD_FOLDER + filename (leading slash, no doubles). */
export function buildDropboxFilePath(filename) {
  const folder = (
    process.env.DROPBOX_UPLOAD_FOLDER?.trim() ||
    process.env.VITE_DROPBOX_UPLOAD_FOLDER?.trim() ||
    ''
  ).replace(/\\/g, '/')
  const prefix = folder ? (folder.startsWith('/') ? folder : `/${folder}`) : ''
  return `${prefix}/${filename}`.replace(/\/{2,}/g, '/')
}
