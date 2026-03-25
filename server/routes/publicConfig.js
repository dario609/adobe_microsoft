import { Router } from 'express'
import { getSessionTimerPublicConfig, getSitePasswordConfig } from '../utils/publicConfig.js'

export function createPublicConfigRouter() {
  const router = Router()

  router.get('/config', (_req, res) => {
    const timer = getSessionTimerPublicConfig()
    const gate = getSitePasswordConfig()
    res.json({
      sessionSeconds: timer.sessionSeconds,
      showSessionTimer: timer.showSessionTimer,
      sitePasswordRequired: gate.required,
    })
  })

  return router
}
