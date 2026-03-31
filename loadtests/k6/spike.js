import { sleep } from 'k6'
import { apiBase, obtainSiteToken, postUpload, requireTokenOrSkip } from './common.js'

const spikeTarget = Number(__ENV.SPIKE_VUS || 20)
const cycles = Number(__ENV.SPIKE_CYCLES || 10)

const stages = []
for (let i = 0; i < cycles; i++) {
  stages.push({ duration: '5s', target: spikeTarget })
  stages.push({ duration: '10s', target: spikeTarget })
  stages.push({ duration: '45s', target: 0 })
}

export const options = {
  scenarios: {
    spikes: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages,
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.2'],
    http_req_duration: ['p(99)<120000'],
  },
}

export function setup() {
  const base = apiBase()
  const token = obtainSiteToken(base)
  requireTokenOrSkip(base, token)
  return { base, token }
}

export default function (data) {
  const name = `k6_spike_${__VU}_${__ITER}_${Date.now()}.png`
  postUpload(data.base, data.token, name)
  sleep(0.02)
}
