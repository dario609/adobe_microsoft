function normalizeBaseUrl(v) {
  const s = String(v || '').trim()
  if (!s) return ''
  return s.endsWith('/') ? s.slice(0, -1) : s
}

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL)

/** Build an absolute (or relative) API URL. */
export function apiUrl(pathname) {
  const rawPath = String(pathname || '')
  const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`
  if (!API_BASE_URL) return path

  // Prevent accidental "/api/api/*" when VITE_API_BASE_URL already includes "/api".
  if (API_BASE_URL.endsWith('/api') && path.startsWith('/api/')) {
    return `${API_BASE_URL}${path.slice(4)}`
  }
  if (API_BASE_URL.endsWith('/api') && path === '/api') {
    return API_BASE_URL
  }
  return `${API_BASE_URL}${path}`
}

