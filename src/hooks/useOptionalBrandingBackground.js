import { useEffect, useState } from 'react'
import { apiUrl } from '../api/apiBase.js'

/**
 * Fetches a public branding asset; 404 yields no style (caller keeps default chrome).
 * @param {string} relativePath e.g. `/api/branding/session-header-background`
 */
export function useOptionalBrandingBackground(relativePath) {
  const [state, setState] = useState({ hasImage: false, style: undefined })

  useEffect(() => {
    let cancelled = false
    let objectUrl = ''
    ;(async () => {
      try {
        const res = await fetch(apiUrl(relativePath), { cache: 'no-store' })
        if (cancelled) return
        if (!res.ok) {
          setState({ hasImage: false, style: undefined })
          return
        }
        const blob = await res.blob()
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setState({
          hasImage: true,
          style: {
            backgroundImage: `url(${objectUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          },
        })
      } catch {
        if (!cancelled) setState({ hasImage: false, style: undefined })
      }
    })()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [relativePath])

  return state
}
