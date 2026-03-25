import { useCallback, useRef, useState } from 'react'

/**
 * Operator control: POST PNG to /api/banner, then parent bumps cache so SessionBanner reloads.
 */
export function BannerHeroUpload({ onUploaded, disabled }) {
  const inputRef = useRef(null)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  const runUpload = useCallback(
    async (file) => {
      if (!file || disabled || busy) return
      if (file.type !== 'image/png') {
        setStatus('Choose a PNG file.')
        return
      }
      setBusy(true)
      setStatus('Uploading…')
      try {
        const fd = new FormData()
        fd.append('banner', file)
        const res = await fetch('/api/banner', { method: 'POST', body: fd })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(typeof data.error === 'string' ? data.error : `Upload failed (${res.status})`)
        }
        setStatus('Saved — shown above the editor.')
        onUploaded?.()
      } catch (e) {
        setStatus(e?.message || 'Upload failed.')
      } finally {
        setBusy(false)
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [busy, disabled, onUploaded]
  )

  const onInputChange = (e) => {
    const f = e.target.files?.[0]
    if (f) runUpload(f)
  }

  const onRemove = async () => {
    if (disabled || busy) return
    setBusy(true)
    setStatus('Removing…')
    try {
      const res = await fetch('/api/banner', { method: 'DELETE' })
      if (!res.ok) throw new Error('Could not remove banner.')
      setStatus('Banner removed.')
      onUploaded?.()
    } catch (e) {
      setStatus(e?.message || 'Remove failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sessionBannerUpload" aria-label="Hero image for above the editor">
      <div className="sessionBannerUpload__row">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,.png"
          className="sessionBannerUpload__input"
          onChange={onInputChange}
          disabled={disabled || busy}
          id="session-banner-file"
        />
        <label htmlFor="session-banner-file" className="btn btn--ghost sessionBannerUpload__choose">
          {busy ? 'Please wait…' : 'Upload PNG (above editor)'}
        </label>
        <button
          type="button"
          className="btn btn--ghost sessionBannerUpload__remove"
          onClick={onRemove}
          disabled={disabled || busy}
        >
          Remove
        </button>
      </div>
      {status ? (
        <p className="sessionBannerUpload__status" role="status">
          {status}
        </p>
      ) : null}
    </div>
  )
}
