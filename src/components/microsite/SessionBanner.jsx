import { useState } from 'react'

/**
 * Shows PNG from GET /api/banner when the operator has uploaded one (POST /api/banner).
 */
export function SessionBanner() {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (failed) return null

  return (
    <figure className={`sessionBanner${loaded ? ' sessionBanner--loaded' : ''}`} aria-hidden={!loaded}>
      <img
        className="sessionBanner__img"
        src="/api/banner"
        alt=""
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </figure>
  )
}
