import { apiUrl } from './apiBase.js'
import { apiFetch } from './apiFetch.js'
import { friendlyNetworkFailure, friendlyUploadFailure } from '../utils/uploadErrors.js'

const uploadDebug =
  typeof import.meta !== 'undefined' &&
  (import.meta.env.DEV === true || import.meta.env.VITE_DEBUG_UPLOAD === 'true')

function logUpload(stage, info) {
  if (!uploadDebug) return
  console.info(`[upload:${stage}]`, info)
}

export async function uploadDesignToServer(blob, filename) {
  const fd = new FormData()
  fd.append('file', blob, 'export.png')
  fd.append('filename', filename)
  const idem =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  const url = apiUrl('/api/upload')
  logUpload('request', { url, filename, bytes: blob?.size, idempotencyKey: idem })

  let res
  try {
    res = await apiFetch('/api/upload', {
      method: 'POST',
      body: fd,
      headers: { 'Idempotency-Key': idem },
    })
  } catch (err) {
    logUpload('network_error', { url, message: err?.message || String(err) })
    throw new Error(friendlyNetworkFailure())
  }

  const data = await res.json().catch(() => ({}))
  logUpload('response', {
    url,
    httpStatus: res.status,
    ok: res.ok,
    apiCode: data?.code,
    apiError: typeof data?.error === 'string' ? data.error : undefined,
    apiDetail: typeof data?.detail === 'string' ? data.detail : undefined,
  })

  if (!res.ok) {
    throw new Error(friendlyUploadFailure(res, data))
  }
}
