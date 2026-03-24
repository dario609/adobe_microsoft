import { safeBaseName } from '../utils/dataUrl.js'

export async function uploadDesignToServer(blob, baseName) {
  const fd = new FormData()
  const name = safeBaseName(baseName) || `design-${Date.now()}`
  fd.append('file', blob, `${name}.png`)
  fd.append('filename', name)

  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Upload failed (${res.status})`)
  }
  return data
}
