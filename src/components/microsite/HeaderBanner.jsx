import { useEffect, useState } from 'react'
import { apiFetch, getSiteGateToken } from '../../api/apiFetch.js'

export function HeaderBanner({ cacheKey = 0 }) {
  const [src, setSrc] = useState('')

  useEffect(() => {
    let cancelled = false
    let objectUrl = ''

    ;(async () => {
      try {
        const qs = new URLSearchParams({ v: String(cacheKey) })
        const gate = getSiteGateToken()
        if (gate) qs.set('gate', gate)
        const res = await apiFetch(`/api/banner?${qs}`, { cache: 'no-store' })
        if (!res.ok) return
        const blob = await res.blob()
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      } catch {
        setSrc('')
      }
    })()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [cacheKey])

  if (!src) return null
  return <img className="sessionHeader__heroImg" src={src} alt="" />
}
