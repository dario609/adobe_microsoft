import { apiUrl } from './apiBase.js'

const STORAGE_KEY = 'microsite_site_gate_v1'

/** In-memory fallback when Safari / private mode blocks storage (common on iPad). */
let memoryToken = ''

export function getSiteGateToken() {
  if (memoryToken) return memoryToken
  try {
    const a = localStorage.getItem(STORAGE_KEY)
    if (a) {
      memoryToken = a
      return a
    }
  } catch {
    /* ignore */
  }
  try {
    const b = sessionStorage.getItem(STORAGE_KEY)
    if (b) {
      memoryToken = b
      return b
    }
  } catch {
    /* ignore */
  }
  return ''
}

export function setSiteGateToken(token) {
  const t = String(token || '').trim()
  memoryToken = t
  try {
    localStorage.setItem(STORAGE_KEY, t)
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, t)
  } catch {
    /* ignore */
  }
}

export function clearSiteGateToken() {
  memoryToken = ''
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * Authenticated fetch to the API (credentials + gate token header).
 * Sends both `X-Site-Token` and `Authorization: Bearer` so proxies / Safari stay compatible.
 */
export function apiFetch(pathname, init = {}) {
  const url = pathname.startsWith('http') ? pathname : apiUrl(pathname)
  const next = { ...init }
  const headers = new Headers(init.headers || undefined)
  const token = getSiteGateToken()
  if (token) {
    if (!headers.has('X-Site-Token')) headers.set('X-Site-Token', token)
    if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)
  }
  next.headers = headers
  if (!next.credentials) next.credentials = 'include'
  return fetch(url, next)
}
