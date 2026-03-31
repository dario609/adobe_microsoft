import { apiUrl } from './apiBase.js'

const STORAGE_KEY = 'microsite_site_gate_v1'
const ADMIN_STORAGE_KEY = 'microsite_admin_gate_v1'

/** In-memory fallback when Safari / private mode blocks storage (common on iPad). */
let memoryToken = ''
let memoryAdminToken = ''

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

export function getAdminGateToken() {
  if (memoryAdminToken) return memoryAdminToken
  try {
    const a = localStorage.getItem(ADMIN_STORAGE_KEY)
    if (a) {
      memoryAdminToken = a
      return a
    }
  } catch {
    /* ignore */
  }
  try {
    const b = sessionStorage.getItem(ADMIN_STORAGE_KEY)
    if (b) {
      memoryAdminToken = b
      return b
    }
  } catch {
    /* ignore */
  }
  return ''
}

export function setAdminGateToken(token) {
  const t = String(token || '').trim()
  memoryAdminToken = t
  try {
    localStorage.setItem(ADMIN_STORAGE_KEY, t)
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.setItem(ADMIN_STORAGE_KEY, t)
  } catch {
    /* ignore */
  }
}

export function clearAdminGateToken() {
  memoryAdminToken = ''
  try {
    localStorage.removeItem(ADMIN_STORAGE_KEY)
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.removeItem(ADMIN_STORAGE_KEY)
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
  const siteToken = getSiteGateToken()
  if (siteToken) {
    if (!headers.has('X-Site-Token')) headers.set('X-Site-Token', siteToken)
    if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${siteToken}`)
  }
  const adminToken = getAdminGateToken()
  if (adminToken && !headers.has('X-Admin-Token')) {
    headers.set('X-Admin-Token', adminToken)
  }
  next.headers = headers
  if (!next.credentials) next.credentials = 'include'
  return fetch(url, next)
}
