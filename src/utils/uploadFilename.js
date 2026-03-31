/**
 * Dropbox upload basename: sanitized pickup name + local timestamp (unique per export).
 */

export function sanitizePickupBaseForFilename(s) {
  const t = String(s || '').trim()
  if (!t) return 'Pickup'
  return t
    .replace(/[/\\<>:"|?*]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 80)
}

export function formatTimestampForUploadFilename(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

export function buildPickupExportFilename(pickupName) {
  const base = sanitizePickupBaseForFilename(pickupName)
  const ts = formatTimestampForUploadFilename()
  return `${base}_${ts}.png`
}
