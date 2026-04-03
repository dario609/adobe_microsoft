import { useRef, useState } from 'react'
import { apiFetch } from '../../api/apiFetch.js'

async function readErrorMessage(res, fallback) {
  const json = await res.json().catch(() => null)
  if (json && typeof json.error === 'string' && json.error.trim()) return json.error
  const text = await res.text().catch(() => '')
  const body = String(text || '').trim()
  if (body) return `${fallback} (${res.status}): ${body.slice(0, 180)}`
  return `${fallback} (${res.status})`
}

/** Server routes: POST/DELETE `/api/banner` or `/api/banner-admin` (not `/api/banner-admin/banner`). */
function resolveBannerUploadPath(apiPrefix) {
  const base = String(apiPrefix || '/api').replace(/\/$/, '')
  if (base.endsWith('/banner-admin') || base.endsWith('/banner')) return base
  return `${base}/banner`
}

export function BannerHeroUpload({ onUploaded, disabled, apiPrefix = '/api' }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const runUpload = async (file) => {
    if (!file || disabled || busy) return
    setError('')
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('banner', file)
      const res = await apiFetch(resolveBannerUploadPath(apiPrefix), { method: 'POST', body: fd })
      if (!res.ok) {
        throw new Error(await readErrorMessage(res, 'Upload failed'))
      }
      onUploaded?.()
    } catch (e) {
      setError(e?.message || 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  const onRemove = async () => {
    if (disabled || busy) return
    setError('')
    setBusy(true)
    try {
      const res = await apiFetch(resolveBannerUploadPath(apiPrefix), { method: 'DELETE' })
      if (!res.ok) {
        throw new Error(await readErrorMessage(res, 'Remove failed'))
      }
      onUploaded?.()
    } catch (e) {
      setError(e?.message || 'Remove failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sessionBannerUpload">
      <div className="sessionBannerUpload__row">
        <label className="sessionBannerUpload__choose">
          <input
            ref={inputRef}
            className="sessionBannerUpload__input"
            type="file"
            accept="*/*"
            disabled={disabled || busy}
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) runUpload(f)
            }}
          />
          <span className="btn btn--dark btn--small">{busy ? 'Working…' : 'Upload file'}</span>
        </label>
        <button type="button" className="btn btn--dark btn--small" disabled={disabled || busy} onClick={onRemove}>
          Remove
        </button>
      </div>
      {error ? (
        <p className="appError appError--standalone" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
