import { apiUrl } from './apiBase.js'

const TOKEN_KEY = 'site_gate_token'

export function getSiteGateToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function setSiteGateToken(token) {
  try {
    if (!token) localStorage.removeItem(TOKEN_KEY)
    else localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* ignore */
  }
}

/**
 * fetch wrapper that supports Render+Vercel deployments:
 * - uses VITE_API_BASE_URL when set
 * - sends credentials for cookie mode
 * - also sends X-Site-Token header for header-token mode
 */
export async function apiFetch(pathname, init = {}) {
  const url = apiUrl(pathname)
  const headers = new Headers(init.headers || {})
  const token = getSiteGateToken()
  if (token && !headers.has('X-Site-Token')) {
    headers.set('X-Site-Token', token)
  }
  return await fetch(url, {
    ...init,
    credentials: init.credentials ?? 'include',
    headers,
  })
}

