import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../../api/apiFetch.js'
import { apiUrl } from '../../api/apiBase.js'

export function AdminGalleryPanel() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const res = await apiFetch('/api/gallery', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Could not load gallery.')
      setItems(Array.isArray(data?.items) ? data.items : [])
    } catch (e) {
      setError(e?.message || 'Could not load gallery.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const onFiles = async (e) => {
    const files = e.target.files
    e.target.value = ''
    if (!files?.length) return
    setError('')
    setBusy(true)
    try {
      const fd = new FormData()
      for (const f of files) {
        fd.append('images', f)
      }
      const res = await apiFetch('/api/gallery', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Upload failed.')
      await load()
    } catch (err) {
      setError(err?.message || 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id) => {
    setError('')
    setBusy(true)
    try {
      const res = await apiFetch(`/api/gallery/${encodeURIComponent(id)}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Remove failed.')
      await load()
    } catch (err) {
      setError(err?.message || 'Remove failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="adminGallery">
      <div className="adminGallery__uploadRow">
        <label className="btn btn--dark btn--small adminGallery__fileLabel">
          {busy ? 'Working…' : 'Upload PNGs'}
          <input
            className="adminGallery__fileInput"
            type="file"
            accept="image/png"
            multiple
            disabled={busy}
            onChange={onFiles}
          />
        </label>
        <span className="adminGallery__fileHint">You can select multiple files at once.</span>
      </div>
      {error ? (
        <p className="appError appError--standalone" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? <p className="adminGallery__muted">Loading…</p> : null}
      {!loading ? (
        <ul className="adminGallery__grid" role="list">
          {items.length === 0 ? (
            <li className="adminGallery__empty">No PNGs uploaded yet.</li>
          ) : (
            items.map((it) => (
              <li key={it.id} className="adminGallery__card">
                <div className="adminGallery__thumbWrap">
                  <img
                    className="adminGallery__thumb"
                    src={apiUrl(`/api/gallery/image/${it.id}`)}
                    alt=""
                    loading="lazy"
                  />
                </div>
                <p className="adminGallery__name" title={it.originalName}>
                  {it.originalName || 'image.png'}
                </p>
                <button type="button" className="btn btn--ghost btn--small adminGallery__remove" disabled={busy} onClick={() => remove(it.id)}>
                  Remove
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
