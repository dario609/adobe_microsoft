import { useState } from 'react'
import { apiUrl } from '../../api/apiBase.js'
import { BRAND_LOGO_URL } from '../../constants/config.js'

/**
 * Experience logo from API when uploaded; falls back to Vite public asset on 404 or error.
 * Remount (e.g. change `key`) after admin upload so the browser refetches.
 */
export function ExperienceLogoImg({ className, width, height }) {
  const [failed, setFailed] = useState(false)
  const [v] = useState(() => String(Date.now()))
  const apiSrc = `${apiUrl('/api/branding/experience-logo')}?v=${encodeURIComponent(v)}`
  const src = failed ? BRAND_LOGO_URL : apiSrc

  return (
    <img
      className={className}
      src={src}
      alt=""
      width={width}
      height={height}
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}
