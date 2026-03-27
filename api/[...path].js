/**
 * Vercel Serverless: forwards same-origin /api/* to your Express API on Render.
 *
 * Vercel → Project → Settings → Environment Variables:
 *   API_BACKEND_URL = https://your-service.onrender.com   (no trailing slash)
 *
 * Leave VITE_API_BASE_URL unset so the browser uses /api → this proxy, or set
 * VITE_API_BASE_URL to the same Render URL (direct calls; proxy unused).
 */

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

async function proxyRequest(request) {
  const raw = process.env.API_BACKEND_URL || process.env.RENDER_API_URL || ''
  const base = String(raw).trim().replace(/\/$/, '')
  if (!base) {
    return json(502, {
      error:
        'Vercel proxy: set API_BACKEND_URL (or RENDER_API_URL) to your Render API origin, e.g. https://your-app.onrender.com',
    })
  }

  let target
  try {
    const incoming = new URL(request.url)
    target = new URL(incoming.pathname + incoming.search, base.endsWith('/') ? base : `${base}/`)
  } catch {
    return json(502, { error: 'Invalid API_BACKEND_URL.' })
  }

  const headers = new Headers(request.headers)
  headers.set('host', target.host)
  headers.delete('connection')
  headers.delete('content-length')

  /** @type {RequestInit} */
  const init = {
    method: request.method,
    headers,
    redirect: 'manual',
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body
    init.duplex = 'half'
  }

  let upstream
  try {
    upstream = await fetch(target, init)
  } catch (e) {
    console.error('[api proxy]', e)
    return json(502, { error: 'Could not reach API backend.' })
  }

  const out = new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
  })
  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'transfer-encoding') return
    out.headers.set(key, value)
  })
  return out
}

export const GET = proxyRequest
export const HEAD = proxyRequest
export const POST = proxyRequest
export const PUT = proxyRequest
export const PATCH = proxyRequest
export const DELETE = proxyRequest
export const OPTIONS = proxyRequest
