import { sleep } from 'k6'
import { apiBase, obtainSiteToken, postUpload, requireTokenOrSkip } from './common.js'

export const options = {
  scenarios: {
    baseline: {
      executor: 'constant-arrival-rate',
      rate: 1,
      timeUnit: '1s',
      duration: __ENV.DURATION || '10m',
      preAllocatedVUs: 5,
      maxVUs: 25,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.1'],
    http_req_duration: ['p(95)<30000'],
  },
}

export function setup() {
  const base = apiBase()
  const token = obtainSiteToken(base)
  requireTokenOrSkip(base, token)
  return { base, token }
}

export default function (data) {
  const name = `k6_baseline_${__VU}_${Date.now()}.png`
  const res = postUpload(data.base, data.token, name)
  if (res.status !== 200 && res.status !== 503) {
    console.warn(`baseline upload status ${res.status} body ${String(res.body).slice(0, 200)}`)
  }
  sleep(0.1)
}
