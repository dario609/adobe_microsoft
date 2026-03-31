/**
 * Shared helpers for k6 scenarios (path: loadtests/k6/*.js).
 * Requires k6: https://k6.io/docs/getting-started/installation/
 */
import encoding from 'k6/encoding'
import http from 'k6/http'

/** 1×1 transparent PNG */
const PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

let _png

export function minimalPngBytes() {
  if (!_png) _png = encoding.b64decode(PNG_B64)
  return _png
}

export function apiBase() {
  return (__ENV.BASE_URL || 'http://127.0.0.1:3001').replace(/\/$/, '')
}

/** Site gate token: SITE_TOKEN / K6_SITE_TOKEN, or SITE_PASSWORD + POST /api/auth/site/login */
export function obtainSiteToken(base) {
  const fromEnv = (__ENV.SITE_TOKEN || __ENV.K6_SITE_TOKEN || '').trim()
  if (fromEnv) return fromEnv
  const pwd = (__ENV.SITE_PASSWORD || '').trim()
  if (!pwd) return ''
  const res = http.post(`${base}/api/auth/site/login`, JSON.stringify({ password: pwd }), {
    headers: { 'Content-Type': 'application/json' },
  })
  if (res.status !== 200) return ''
  try {
    const j = res.json()
    return typeof j.token === 'string' ? j.token : ''
  } catch {
    return ''
  }
}

/**
 * @param {string} base
 * @param {string} token
 * @param {string} filename
 * @param {Record<string, string>} [extraHeaders]
 */
export function postUpload(base, token, filename, extraHeaders = {}) {
  const url = `${base}/api/upload`
  const h = { ...extraHeaders }
  if (token) {
    h['X-Site-Token'] = token
    h['Authorization'] = `Bearer ${token}`
  }
  const body = {
    file: http.file(minimalPngBytes(), 'export.png', 'image/png'),
    filename,
  }
  return http.post(url, body, { headers: h })
}

export function requireTokenOrSkip(base, token) {
  const needProbe = http.get(`${base}/api/auth/site`)
  let required = false
  try {
    const j = needProbe.json()
    required = j.required === true
  } catch {
    /* ignore */
  }
  if (required && !token) {
    throw new Error(
      'Site password is required: set SITE_TOKEN (from browser session) or SITE_PASSWORD for k6 login.'
    )
  }
}
