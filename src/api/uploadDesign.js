import { safeBaseName } from '../utils/dataUrl.js'

export async function uploadDesignToServer(blob, baseName) {
  const fd = new FormData()
  const name = safeBaseName(baseName) || `design-${Date.now()}`
  fd.append('file', blob, `${name}.png`)
  fd.append('filename', name)

  let res
  try {
    res = await fetch('/api/upload', { method: 'POST', body: fd })
  } catch {
    throw new Error(
      'Cannot reach the upload API. Run `npm run dev` (starts Vite + server) or run `npm run dev:api` in a second terminal on port 3001.'
    )
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Upload failed (${res.status})`)
  }
  return data
}
