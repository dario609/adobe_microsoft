import { apiFetch } from './apiFetch.js'
import { friendlyNetworkFailure, friendlyUploadFailure } from '../utils/uploadErrors.js'

export async function uploadDesignToServer(blob, filename) {
  const fd = new FormData()
  fd.append('file', blob, 'export.png')
  fd.append('filename', filename)

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
}
