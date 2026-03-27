/**
 * True for iPhone / iPad / iPod touch browsers (all use WebKit; “Chrome” on iOS is still WebKit).
 * Includes iPadOS “desktop” mode: Safari reports MacIntel + touch.
 */
export function isIOSOrIPadWebKit() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/iPad|iPhone|iPod/i.test(ua)) return true
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true
  return false
}
