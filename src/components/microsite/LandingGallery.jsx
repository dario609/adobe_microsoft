import { useCallback, useEffect, useState } from 'react'
import { apiUrl } from '../../api/apiBase.js'
import { getGalleryPickId, setGalleryPickId } from '../../constants/gallerySelection.js'

export function LandingGallery({ onSelectionChange }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(() => getGalleryPickId())

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/gallery'), { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Could not load images.')
      setItems(Array.isArray(data?.items) ? data.items : [])
    } catch (e) {
      setError(e?.message || 'Could not load images.')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const pick = (id) => {
    setSelectedId(id)
    setGalleryPickId(id)
    onSelectionChange?.()
  }

  return (
    <div className="landGallery">
      <h2 className="landGallery__title">Choose a header image</h2>
      <p className="landGallery__hint">Tap an image to use it above the editor, then press Start.</p>
      {error ? <p className="landGallery__error">{error}</p> : null}
      {loading ? <p className="landGallery__muted">Loading images…</p> : null}
      {!loading && items.length === 0 ? (
        <p className="landGallery__muted">No images yet. Ask an operator to upload PNGs in the admin panel.</p>
      ) : null}
      {!loading && items.length > 0 ? (
        <ul className="landGallery__grid" role="list">
          {items.map((it) => {
            const src = apiUrl(`/api/gallery/image/${it.id}?v=${encodeURIComponent(it.uploadedAt || '')}`)
            const active = selectedId === it.id
            return (
              <li key={it.id} className="landGallery__item">
                <button
                  type="button"
                  className={`landGallery__thumbBtn${active ? ' landGallery__thumbBtn--active' : ''}`}
                  onClick={() => pick(it.id)}
                >
                  <img className="landGallery__thumb" src={src} alt="" loading="lazy" />
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
