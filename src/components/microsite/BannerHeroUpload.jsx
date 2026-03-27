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
      const res = await apiFetch(`${apiPrefix}/banner`, { method: 'POST', body: fd })
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
      const res = await apiFetch(`${apiPrefix}/banner`, { method: 'DELETE' })
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
            accept="image/png"
            disabled={disabled || busy}
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) runUpload(f)
            }}
          />
          <span className="btn btn--dark btn--small">{busy ? 'Working…' : 'Upload PNG'}</span>
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
