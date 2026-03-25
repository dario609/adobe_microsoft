function normalizeBaseUrl(v) {
  const s = String(v || '').trim()
  if (!s) return ''
  return s.endsWith('/') ? s.slice(0, -1) : s
}

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL)

/** Build an absolute (or relative) API URL. */
export function apiUrl(pathname) {
  const p = String(pathname || '')
  const path = p.startsWith('/') ? p : `/${p}`
  return `${API_BASE_URL}${path}`
}

