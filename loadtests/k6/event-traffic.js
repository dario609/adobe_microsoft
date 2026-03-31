import { sleep } from 'k6'
import { apiBase, obtainSiteToken, postUpload, requireTokenOrSkip } from './common.js'

export const options = {
  scenarios: {
    event_like: {
      executor: 'constant-vus',
      vus: Number(__ENV.EVENT_VUS || 5),
      duration: __ENV.DURATION || '15m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.15'],
    http_req_duration: ['p(95)<45000'],
  },
}

export function setup() {
  const base = apiBase()
  const token = obtainSiteToken(base)
  requireTokenOrSkip(base, token)
  return { base, token }
}

export default function (data) {
  const name = `k6_event_${__VU}_${__ITER}_${Date.now()}.png`
  postUpload(data.base, data.token, name)
  sleep(0.05)
}
