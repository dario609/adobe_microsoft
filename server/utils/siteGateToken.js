import crypto from 'node:crypto'
import { getAuthCookieSecret } from './publicConfig.js'

const COOKIE = 'microsite_gate'
const MAX_AGE_SEC = 60 * 60 * 24 * 7

export { COOKIE as SITE_GATE_COOKIE_NAME, MAX_AGE_SEC as SITE_GATE_MAX_AGE_SEC }

function signPayload(payloadB64) {
  const secret = getAuthCookieSecret()
  return crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url')
}

export function createGateToken() {
  const exp = Date.now() + MAX_AGE_SEC * 1000
  const payloadB64 = Buffer.from(JSON.stringify({ exp }), 'utf8').toString('base64url')
  const sig = signPayload(payloadB64)
  return `${payloadB64}.${sig}`
}

/** @param {string | undefined} token */
export function verifyGateToken(token) {
  if (!token || typeof token !== 'string') return false
  const dot = token.indexOf('.')
  if (dot < 1) return false
  const payloadB64 = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  try {
    const expected = signPayload(payloadB64)
    const a = Buffer.from(sig, 'utf8')
    const b = Buffer.from(expected, 'utf8')
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false
    const data = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))
    if (typeof data.exp !== 'number' || data.exp < Date.now()) return false
    return true
  } catch {
    return false
  }
}

export function readGateCookie(req) {
  const raw = req.headers.cookie
  if (!raw) return ''
  const parts = raw.split(';')
  for (const p of parts) {
    const s = p.trim()
    if (s.startsWith(`${COOKIE}=`)) {
      try {
        return decodeURIComponent(s.slice(COOKIE.length + 1))
      } catch {
        return ''
      }
    }
  }
  return ''
}

export function setGateCookieHeader(res, token) {
  const crossSite = ['true', '1', 'yes', 'on'].includes(
    String(process.env.SITE_CROSS_SITE_COOKIES || '').trim().toLowerCase()
  )
  const parts = [
    `${COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${MAX_AGE_SEC}`,
    'HttpOnly',
    crossSite ? 'SameSite=None' : 'SameSite=Lax',
  ]
  if (process.env.NODE_ENV === 'production' || crossSite) parts.push('Secure')
  res.setHeader('Set-Cookie', parts.join('; '))
}

export function clearGateCookieHeader(res) {
  const crossSite = ['true', '1', 'yes', 'on'].includes(
    String(process.env.SITE_CROSS_SITE_COOKIES || '').trim().toLowerCase()
  )
  const parts = [`${COOKIE}=`, 'Path=/', 'Max-Age=0', 'HttpOnly', crossSite ? 'SameSite=None' : 'SameSite=Lax']
  if (process.env.NODE_ENV === 'production' || crossSite) parts.push('Secure')
  res.setHeader('Set-Cookie', parts.join('; '))
}
