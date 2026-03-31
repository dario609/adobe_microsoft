import { useCallback, useEffect, useRef, useState } from 'react'
import { apiUrl } from '../../api/apiBase.js'
import { getGalleryPickId, getGalleryTemplateId, setGalleryPickId } from '../../constants/gallerySelection.js'

export function LandingGallery({ onSelectionChange }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(() => getGalleryPickId())
  const railRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

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
    if (getGalleryPickId() === it.id && getGalleryTemplateId() === tid) return
    setGalleryPickId(it.id, tid)
    onSelectionChange?.()
  }, [items, selectedId, onSelectionChange])

  const updateScrollButtons = useCallback(() => {
    const el = railRef.current
    if (!el) {
      setCanScrollLeft(false)
      setCanScrollRight(false)
      return
    }
    const maxLeft = Math.max(0, el.scrollWidth - el.clientWidth)
    const left = el.scrollLeft
    setCanScrollLeft(left > 6)
    setCanScrollRight(left < maxLeft - 6)
  }, [])

  useEffect(() => {
    updateScrollButtons()
  }, [items, loading, updateScrollButtons])

  useEffect(() => {
    const el = railRef.current
    if (!el) return () => {}
    const onScroll = () => updateScrollButtons()
    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [updateScrollButtons])

  const pick = (it) => {
    setSelectedId(it.id)
    setGalleryPickId(it.id, it.templateId || '')
    onSelectionChange?.()
  }

  const scrollRail = (dir) => {
    const el = railRef.current
    if (!el) return
    const amount = Math.max(220, Math.floor(el.clientWidth * 0.8))
    el.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }

  return (
    <div className="landGallery">
      {error ? <p className="landGallery__error">{error}</p> : null}
      {loading ? <p className="landGallery__muted">Loading images…</p> : null}
      {!loading && items.length === 0 ? (
        <p className="landGallery__muted">No images yet. Ask an operator to upload PNGs in the admin panel.</p>
      ) : null}
      {!loading && items.length > 0 ? (
        <div className="landGallery__carousel">
          <button
            type="button"
            className="landGallery__navBtn"
            aria-label="Show previous images"
            onClick={() => scrollRail(-1)}
            disabled={!canScrollLeft}
          >
            <span className="landGallery__navIcon" aria-hidden="true">
              &#10094;
            </span>
          </button>
          <ul className="landGallery__rail" role="list" ref={railRef}>
            {items.map((it) => {
              const src = apiUrl(`/api/gallery/image/${it.id}?v=${encodeURIComponent(it.uploadedAt || '')}`)
              const active = selectedId === it.id
              return (
                <li key={it.id} className="landGallery__item">
                  <button
                    type="button"
                    className={`landGallery__thumbBtn${active ? ' landGallery__thumbBtn--active' : ''}`}
                    onClick={() => pick(it)}
                    aria-pressed={active}
                  >
                    <img className="landGallery__thumb" src={src} alt="" loading="lazy" />
                  </button>
                </li>
              )
            })}
          </ul>
          <button
            type="button"
            className="landGallery__navBtn"
            aria-label="Show next images"
            onClick={() => scrollRail(1)}
            disabled={!canScrollRight}
          >
            <span className="landGallery__navIcon" aria-hidden="true">
              &#10095;
            </span>
          </button>
        </div>
      ) : null}
    </div>
  )
}
