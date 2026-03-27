import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../../api/apiFetch.js'
import { apiUrl } from '../../api/apiBase.js'

async function parseJson(res) {
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json().catch(() => ({}))
  const text = await res.text().catch(() => '')
  return { _text: text }
}

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
      const data = await parseJson(res)
      if (!res.ok) {
        let hint = ''
        if (res.status === 404) {
          hint =
            ' Not found — redeploy the backend with gallery routes, or set VITE_API_BASE_URL to your Render API URL.'
        }
        throw new Error((data?.error || data?._text || 'Could not load gallery.') + hint)
      }
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

  /** Upload one PNG; server returns { items: [entry] }. Show it immediately below. */
  const uploadOne = async (file) => {
    const fd = new FormData()
    fd.append('images', file)
    const res = await apiFetch('/api/gallery', { method: 'POST', body: fd })
    const data = await parseJson(res)
    if (!res.ok) {
      throw new Error(data?.error || data?._text || `Upload failed (${res.status}).`)
    }
    const added = Array.isArray(data?.items) ? data.items : []
    if (added.length) {
      setItems((prev) => {
        const ids = new Set(added.map((x) => x.id))
        const rest = prev.filter((p) => !ids.has(p.id))
        return [...added, ...rest]
      })
    }
  }

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    setError('')
    setBusy(true)
    try {
      for (const f of files) {
        await uploadOne(f)
      }
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
      const data = await parseJson(res)
      if (!res.ok) throw new Error(data?.error || 'Remove failed.')
      setItems((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      setError(err?.message || 'Remove failed.')
    } finally {
      setBusy(false)
    }
  }

  const thumbSrc = (it) => `${apiUrl(`/api/gallery/image/${it.id}`)}?t=${encodeURIComponent(it.uploadedAt || it.id)}`

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
        <span className="adminGallery__fileHint">Select one or many — each file appears below as it finishes.</span>
      </div>
      {error ? (
        <p className="appError appError--standalone adminGallery__error" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? <p className="adminGallery__loading">Loading gallery…</p> : null}
      <ul className="adminGallery__grid" role="list">
        {!loading && items.length === 0 ? (
          <li className="adminGallery__empty">No PNGs uploaded yet.</li>
        ) : null}
        {items.map((it) => (
          <li key={it.id} className="adminGallery__card">
            <div className="adminGallery__thumbWrap">
              <img className="adminGallery__thumb" src={thumbSrc(it)} alt="" loading="lazy" />
            </div>
            <p className="adminGallery__name" title={it.originalName}>
              {it.originalName || 'image.png'}
            </p>
            <button
              type="button"
              className="btn btn--outlineDark btn--small adminGallery__remove"
              disabled={busy}
              onClick={() => remove(it.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
