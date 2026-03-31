import { Router } from 'express'
import {
  getAdminPasswordConfig,
  getSessionTimerPublicConfig,
  getSitePasswordConfig,
} from '../utils/publicConfig.js'
import { writeRuntimeConfigOverrides } from '../utils/runtimeConfigStore.js'

export function createPublicConfigRouter() {
  const router = Router()

  router.get('/config', (_req, res) => {
    const timer = getSessionTimerPublicConfig()
    const gate = getSitePasswordConfig()
    const adminGate = getAdminPasswordConfig()
    res.json({
      sessionSeconds: timer.sessionSeconds,
      showSessionTimer: timer.showSessionTimer,
      sitePasswordEnabled: gate.enabled,
      sitePasswordRequired: gate.required,
      sitePasswordSet: gate.password.length > 0,
      adminPasswordEnabled: adminGate.enabled,
      adminPasswordRequired: adminGate.required,
      adminPasswordSet: adminGate.password.length > 0,
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
    if (req.body?.clearPassword) {
      writeRuntimeConfigOverrides({ siteAccessPassword: '', sitePasswordEnabled: false })
    } else {
      const enabled = Boolean(req.body?.enabled)
      const passwordValue = req.body?.password
      const patch = { sitePasswordEnabled: enabled }
      if (typeof passwordValue === 'string' && passwordValue.trim()) {
        patch.siteAccessPassword = passwordValue.trim()
      }
      writeRuntimeConfigOverrides(patch)
    }
    const gate = getSitePasswordConfig()
    return res.json({
      ok: true,
      sitePasswordEnabled: gate.enabled,
      sitePasswordRequired: gate.required,
      sitePasswordSet: gate.password.length > 0,
    })
  })

  router.post('/config/admin-password', (req, res) => {
    if (req.body?.clearPassword) {
      writeRuntimeConfigOverrides({ adminAccessPassword: '', adminPasswordEnabled: false })
    } else {
      const enabled = Boolean(req.body?.enabled)
      const passwordValue = req.body?.password
      const patch = { adminPasswordEnabled: enabled }
      if (typeof passwordValue === 'string' && passwordValue.trim()) {
        patch.adminAccessPassword = passwordValue.trim()
      }
      writeRuntimeConfigOverrides(patch)
    }
    const gate = getAdminPasswordConfig()
    return res.json({
      ok: true,
      adminPasswordEnabled: gate.enabled,
      adminPasswordRequired: gate.required,
      adminPasswordSet: gate.password.length > 0,
    })
  })

  return router
}
