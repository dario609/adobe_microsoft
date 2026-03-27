import { useMemo } from 'react'
import { isIOSOrIPadWebKit } from '../../utils/device.js'

/**
 * Explains why iPad “Chrome” shows Adobe’s mobile promo instead of the full editor (WebKit + inline embed).
 */
export function IOSExpressNotice() {
  const show = useMemo(() => (typeof window !== 'undefined' ? isIOSOrIPadWebKit() : false), [])
  if (!show) return null

  return (
    <div className="iosExpressNotice" role="note">
      <p className="iosExpressNotice__text">
        iPhone and iPad browsers (including Chrome) use Apple&apos;s WebKit. If you see Adobe&apos;s app promo
        instead of the editor, open the <strong>⋯</strong> menu → <strong>Request Desktop Website</strong>, then
        reload. For kiosks, prefer a desktop browser.
      </p>
    </div>
  )
}
