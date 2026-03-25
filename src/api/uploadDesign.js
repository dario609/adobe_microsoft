import { safeBaseName } from '../utils/dataUrl.js'
import { friendlyNetworkFailure, friendlyUploadFailure } from '../utils/uploadErrors.js'

export async function uploadDesignToServer(blob, baseName) {
  const fd = new FormData()
  const name = safeBaseName(baseName) || `design-${Date.now()}`
  fd.append('file', blob, `${name}.png`)
  fd.append('filename', name)

  let res
  try {
    res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' })
  } catch {
    throw new Error(friendlyNetworkFailure())
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(friendlyUploadFailure(res, data))
  }
  return data
}
