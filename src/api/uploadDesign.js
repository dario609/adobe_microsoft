import { safeBaseName } from '../utils/dataUrl.js'
import { friendlyNetworkFailure, friendlyUploadFailure } from '../utils/uploadErrors.js'
import { apiFetch } from './apiFetch.js'

export async function uploadDesignToServer(blob, baseName) {
  const fd = new FormData()
  const name = safeBaseName(baseName) || `design-${Date.now()}`
  fd.append('file', blob, `${name}.png`)
  fd.append('filename', name)

  let res
  try {
    res = await apiFetch('/api/upload', { method: 'POST', body: fd })
  } catch {
    throw new Error(friendlyNetworkFailure())
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(friendlyUploadFailure(res, data))
  }
  return data
}
