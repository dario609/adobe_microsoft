import { useCallback, useEffect, useState } from 'react'
import { apiUrl } from '../../api/apiBase.js'
import {
  getGalleryCanvasSize,
  getGalleryPickId,
  getGalleryTemplateId,
  getGalleryTemplateType,
  setGalleryPickId,
} from '../../constants/gallerySelection.js'

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
    const tt = it.templateType || 'adobeTemplate'
    const cw = Number(it.canvasWidth) > 0 ? Number(it.canvasWidth) : 0
    const ch = Number(it.canvasHeight) > 0 ? Number(it.canvasHeight) : 0
    const curSize = getGalleryCanvasSize()
    if (
      getGalleryPickId() === it.id &&
      getGalleryTemplateId() === tid &&
      getGalleryTemplateType() === tt &&
      curSize.width === cw &&
      curSize.height === ch
    ) {
      return
    }
    setGalleryPickId(it.id, tid, tt, fe, cw, ch)
    onSelectionChange?.()
  }, [items, selectedId, onSelectionChange])

  const pick = (it) => {
    setSelectedId(it.id)
    const cw = Number(it.canvasWidth) > 0 ? Number(it.canvasWidth) : 0
    const ch = Number(it.canvasHeight) > 0 ? Number(it.canvasHeight) : 0
    setGalleryPickId(
      it.id,
      it.templateId || '',
      it.templateType || 'adobeTemplate',
      it.fileExt || 'png',
      cw,
      ch
    )
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
            const isBlank = (it.templateType || '') === 'blankCanvas'
            return (
              <li key={it.id} className="landGallery__tile">
                <button
                  type="button"
                  className={`landGallery__pick${active ? ' landGallery__pick--active' : ''}`}
                  onClick={() => pick(it)}
                  aria-pressed={active}
                  aria-label={displayName(it)}
                >
                  <span className="landGallery__thumbStack">
                    {isPdf ? (
                      <span className="landGallery__img landGallery__img--pdf" aria-hidden>
                        PDF
                      </span>
                    ) : (
                      <img className="landGallery__img" src={src} alt="" loading="lazy" />
                    )}
                    {isBlank ? (
                      <span className="landGallery__blankBadge" aria-hidden>
                        Blank {it.canvasWidth}×{it.canvasHeight}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
