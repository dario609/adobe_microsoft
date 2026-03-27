import { useEffect, useState } from 'react'
import { apiFetch, getSiteGateToken } from '../../api/apiFetch.js'

/**
 * Loads banner via authenticated fetch (required on iPad / cross-origin where <img> cannot send gate headers).
 * @param {number} [cacheKey] — bump to refetch after upload/remove.
 */
export function SessionBanner({ cacheKey = 0 }) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [objectUrl, setObjectUrl] = useState('')

  useEffect(() => {
    let cancelled = false
    let blobUrl = ''

    setLoaded(false)
    setFailed(false)
    setObjectUrl('')

    ;(async () => {
      try {
        const qs = new URLSearchParams({ v: String(cacheKey) })
        const gate = getSiteGateToken()
        if (gate) qs.set('gate', gate)
        const res = await apiFetch(`/api/banner?${qs}`, { cache: 'no-store' })
        if (res.status === 404) {
          if (!cancelled) setFailed(true)
          return
        }
        if (!res.ok) throw new Error('banner')
        const blob = await res.blob()
        if (cancelled) return
        blobUrl = URL.createObjectURL(blob)
        setObjectUrl(blobUrl)
      } catch {
        if (!cancelled) setFailed(true)
      }
    })()

    return () => {
      cancelled = true
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [cacheKey])

  if (failed || !objectUrl) return null

  return (
    <figure className={`sessionBanner${loaded ? ' sessionBanner--loaded' : ''}`} aria-hidden={!loaded}>
      <img
        className="sessionBanner__img"
        src={objectUrl}
        alt=""
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </figure>
  )
}
