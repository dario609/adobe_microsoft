const IMAGE_EXT = /\.(png|jpg|jpeg|webp)$/i

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
  const folder = (process.env.DROPBOX_UPLOAD_FOLDER || '').trim().replace(/\\/g, '/')
  const prefix = folder ? (folder.startsWith('/') ? folder : `/${folder}`) : ''
  return `${prefix}/${filename}`.replace(/\/{2,}/g, '/')
}
