import { useState } from 'react'
import { apiUrl } from '../../api/apiBase.js'

/**
 * Shows PNG from GET /api/banner when the operator has uploaded one (POST /api/banner).
 * Parent should set `key={bannerCacheKey}` when bumping after upload/remove so state resets.
 * @param {number} [cacheKey] — query string cache-bust (keep in sync with `key`).
 */
export function SessionBanner({ cacheKey = 0 }) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (failed) return null

  return (
    <figure className={`sessionBanner${loaded ? ' sessionBanner--loaded' : ''}`} aria-hidden={!loaded}>
      <img
        className="sessionBanner__img"
        src={apiUrl(`/api/banner?v=${cacheKey}`)}
        alt=""
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </figure>
  )
}
