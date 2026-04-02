import { useEffect, useState } from 'react'
import { apiUrl } from '../../api/apiBase.js'
import { getGalleryPickFileExt, getGalleryPickId } from '../../constants/gallerySelection.js'

/**
 * Shows the PNG selected on the landing page (admin gallery) in the session header.
 */
export function HeaderBanner({ cacheKey = 0 }) {
  const [src, setSrc] = useState('')

  useEffect(() => {
    let cancelled = false
    let objectUrl = ''

    const id = getGalleryPickId()
    const ext = getGalleryPickFileExt().toLowerCase()
    if (ext === 'pdf') {
      Promise.resolve().then(() => {
        if (!cancelled) setSrc(id ? 'pdf' : '')
      })
      return () => {
        cancelled = true
      }
    }
    if (!id) {
      Promise.resolve().then(() => {
        if (!cancelled) setSrc('')
      })
      return () => {
        cancelled = true
      }
    }

    ;(async () => {
      try {
        const res = await fetch(apiUrl(`/api/gallery/image/${id}?v=${cacheKey}`), { cache: 'no-store' })
        if (!res.ok) return
        const blob = await res.blob()
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      } catch {
        if (!cancelled) setSrc('')
      }
    })()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [cacheKey])

  if (src === 'pdf') {
    return (
      <span className="sessionHeader__heroPdf" title="PDF template">
        PDF
      </span>
    )
  }
  if (!src) return null
  return <img className="sessionHeader__heroImg" src={src} alt="" />
}
