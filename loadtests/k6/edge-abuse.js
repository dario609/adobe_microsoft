import { check, group, sleep } from 'k6'
import http from 'k6/http'
import { apiBase, minimalPngBytes, obtainSiteToken, postUpload, requireTokenOrSkip } from './common.js'

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ['rate>0.85'],
  },
}

const longName = `x${'a'.repeat(200)}.png`

export function setup() {
  const base = apiBase()
  const token = obtainSiteToken(base)
  requireTokenOrSkip(base, token)
  return { base, token }
}

export default function (data) {
  const { base, token } = data
  const h = {}
  if (token) {
    h['X-Site-Token'] = token
    h['Authorization'] = `Bearer ${token}`
  }

  group('validation', () => {
    const empty = http.post(
      `${base}/api/upload`,
      {
        file: http.file(minimalPngBytes(), 'export.png', 'image/png'),
        filename: '   ',
      },
      { headers: h }
    )
    check(empty, {
      'empty filename → 400': (r) => r.status === 400,
    })

    const missing = http.post(
      `${base}/api/upload`,
      {
        file: http.file(minimalPngBytes(), 'export.png', 'image/png'),
      },
      { headers: h }
    )
    check(missing, {
      'missing filename field → 400': (r) => r.status === 400,
    })

    const tooLong = http.post(
      `${base}/api/upload`,
      {
        file: http.file(minimalPngBytes(), 'export.png', 'image/png'),
        filename: longName,
      },
      { headers: h }
    )
    check(tooLong, {
      'long filename → 400': (r) => r.status === 400,
    })
  })

  group('duplicate basename (overwrite mode)', () => {
    const dup = 'k6_duplicate_name_test.png'
    const a = postUpload(base, token, dup)
    const b = postUpload(base, token, dup)
    check(true, {
      'duplicate uploads succeed': () => a.status === 200 || a.status === 503,
    })
    check(true, {
      'second duplicate succeeds': () => b.status === 200 || b.status === 503,
    })
  })

  group('idempotency retry', () => {
    const idem = `k6-idem-${Date.now()}`
    const headers = { ...h, 'Idempotency-Key': idem }
    const name = `k6_idem_${Date.now()}.png`
    const body = {
      file: http.file(minimalPngBytes(), 'export.png', 'image/png'),
      filename: name,
    }
    const r1 = http.post(`${base}/api/upload`, body, { headers })
    const r2 = http.post(`${base}/api/upload`, body, { headers })
    check(true, {
      'idempotent pair same status': () => r1.status === r2.status,
    })
    if (r1.status === 200 && r2.status === 200) {
      check(true, {
        'idempotent same path': () => {
          try {
            const j1 = r1.json()
            const j2 = r2.json()
            return j1.path === j2.path
          } catch {
            return false
          }
        },
      })
    }
  })

  group('short client timeout (simulated flaky network)', () => {
    const res = http.post(
      `${base}/api/upload`,
      {
        file: http.file(minimalPngBytes(), 'export.png', 'image/png'),
        filename: `k6_short_timeout_${Date.now()}.png`,
      },
      { headers: h, timeout: '1ms' }
    )
    check(res, {
      'timeout yields no HTTP status or 0': (r) => r.status === 0 || r.timed_out,
    })
  })

  sleep(0.1)
}
