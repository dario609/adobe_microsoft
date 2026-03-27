import { Router } from 'express'
import { getSessionTimerPublicConfig, getSitePasswordConfig } from '../utils/publicConfig.js'
import { writeRuntimeConfigOverrides } from '../utils/runtimeConfigStore.js'

export function createPublicConfigRouter() {
  const router = Router()

  router.get('/config', (_req, res) => {
    const timer = getSessionTimerPublicConfig()
    const gate = getSitePasswordConfig()
    res.json({
      sessionSeconds: timer.sessionSeconds,
      showSessionTimer: timer.showSessionTimer,
      sitePasswordEnabled: gate.enabled,
      sitePasswordRequired: gate.required,
    })
  })

  router.post('/config/session', (req, res) => {
    const n = parseInt(String(req.body?.sessionSeconds ?? ''), 10)
    if (!Number.isFinite(n) || n < 0) {
      return res.status(400).json({ error: 'sessionSeconds must be a number >= 0.' })
    }
    writeRuntimeConfigOverrides({ sessionSeconds: n })
    const timer = getSessionTimerPublicConfig()
    return res.json({ ok: true, sessionSeconds: timer.sessionSeconds, showSessionTimer: timer.showSessionTimer })
  })

  router.post('/config/site-password', (req, res) => {
    const enabled = Boolean(req.body?.enabled)
    const passwordValue = req.body?.password
    const patch = { sitePasswordEnabled: enabled }
    if (typeof passwordValue === 'string') {
      patch.siteAccessPassword = passwordValue.trim()
    }
    writeRuntimeConfigOverrides(patch)
    const gate = getSitePasswordConfig()
    return res.json({ ok: true, sitePasswordEnabled: gate.enabled, sitePasswordRequired: gate.required })
  })

  return router
}
