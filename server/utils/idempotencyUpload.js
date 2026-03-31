/** In-memory idempotency for POST /api/upload (safe client retries). Not for multi-instance without shared store. */

const TTL_MS = Math.max(10000, Number(process.env.IDEMPOTENCY_TTL_MS || 120000))
const MAX_KEYS = Math.max(100, Math.min(100000, Number(process.env.IDEMPOTENCY_MAX_KEYS || 5000)))

/** @type {Map<string, { expires: number, statusCode: number, body: unknown }>} */
const cache = new Map()
/** @type {Map<string, Promise<{ statusCode: number, body: unknown }>>} */
const inflight = new Map()

function prune() {
  const now = Date.now()
  for (const [k, v] of cache) {
    if (v.expires < now) cache.delete(k)
  }
  while (cache.size > MAX_KEYS) {
    const first = cache.keys().next().value
    if (first === undefined) break
    cache.delete(first)
  }
}

/** @param {string | undefined} raw */
export function normalizeIdempotencyKey(raw) {
  if (typeof raw !== 'string') return ''
  const t = raw.trim().slice(0, 256)
  return t
}

/** @param {string} key */
export function getCachedUploadResponse(key) {
  if (!key) return null
  prune()
  const e = cache.get(key)
  if (!e || e.expires < Date.now()) {
    cache.delete(key)
    return null
  }
  return { statusCode: e.statusCode, body: e.body }
}

/**
 * @param {string} key
 * @param {number} statusCode
 * @param {unknown} body
 */
export function setCachedUploadResponse(key, statusCode, body) {
  if (!key) return
  prune()
  cache.set(key, { expires: Date.now() + TTL_MS, statusCode, body })
}

/**
 * @param {string | undefined} rawKey
 * @param {() => Promise<{ statusCode: number, body: unknown }>} work
 */
export async function runUploadWithIdempotency(rawKey, work) {
  const key = normalizeIdempotencyKey(rawKey)
  if (!key) return work()

  const hit = getCachedUploadResponse(key)
  if (hit) return hit

  let p = inflight.get(key)
  if (p) return p

  p = (async () => {
    try {
      const out = await work()
      if (out.statusCode === 200 && out.body && typeof out.body === 'object' && out.body.ok === true) {
        setCachedUploadResponse(key, out.statusCode, out.body)
      }
      return out
    } finally {
      inflight.delete(key)
    }
  })()

  inflight.set(key, p)
  return p
}
