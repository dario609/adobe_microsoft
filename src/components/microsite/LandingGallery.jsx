import { useCallback, useEffect, useState } from 'react'
import { apiUrl } from '../../api/apiBase.js'
import { getGalleryPickId, getGalleryTemplateId, setGalleryPickId } from '../../constants/gallerySelection.js'

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

  /** After /api/gallery loads, sync sessionStorage template from server so Start uses the saved URN. */
  useEffect(() => {
    if (!items.length || !selectedId) return
    const it = items.find((x) => x.id === selectedId)
    if (!it) return
    const tid = it.templateId || ''
    const fe = it.fileExt || 'png'
    if (getGalleryPickId() === it.id && getGalleryTemplateId() === tid) return
    setGalleryPickId(it.id, tid, fe)
    onSelectionChange?.()
  }, [items, selectedId, onSelectionChange])

  const pick = (it) => {
    setSelectedId(it.id)
    setGalleryPickId(it.id, it.templateId || '', it.fileExt || 'png')
    onSelectionChange?.()
  }

  const displayName = (it) => (it.originalName || 'image.png').trim() || 'image.png'

  return (
    <div className="landGallery">
      {error ? <p className="landGallery__error">{error}</p> : null}
      {loading ? <p className="landGallery__muted">Loading images…</p> : null}
      {!loading && items.length === 0 ? (
        <p className="landGallery__muted">No templates yet. Ask an operator to upload images in the admin panel.</p>
      ) : null}
      {!loading && items.length > 0 ? (
        <ul className="landGallery__list" role="list">
          {items.map((it) => {
            const src = apiUrl(`/api/gallery/image/${it.id}?v=${encodeURIComponent(it.uploadedAt || '')}`)
            const active = selectedId === it.id
            const isPdf = (it.fileExt || 'png').toLowerCase() === 'pdf'
            return (
              <li key={it.id} className="landGallery__tile">
                <button
                  type="button"
                  className={`landGallery__pick${active ? ' landGallery__pick--active' : ''}`}
                  onClick={() => pick(it)}
                  aria-pressed={active}
                >
                  {isPdf ? (
                    <span className="landGallery__img landGallery__img--pdf" aria-hidden>
                      PDF
                    </span>
                  ) : (
                    <img className="landGallery__img" src={src} alt="" loading="lazy" />
                  )}
                  <span className="landGallery__caption">{displayName(it)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
