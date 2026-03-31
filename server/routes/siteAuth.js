import crypto from 'node:crypto'
import { Router } from 'express'
import {
  clearAdminGateCookieHeader,
  createAdminGateToken,
  readAdminGateCookie,
  readAdminGateHeader,
  readAdminGateQuery,
  setAdminGateCookieHeader,
  verifyAdminGateToken,
} from '../utils/adminGateToken.js'
import { getAdminPasswordConfig, getSitePasswordConfig } from '../utils/publicConfig.js'
import {
  clearGateCookieHeader,
  createGateToken,
  readGateCookie,
  readGateHeader,
  readGateQuery,
  setGateCookieHeader,
  verifyGateToken,
} from '../utils/siteGateToken.js'

function constantTimeEqual(a, b) {
  const x = Buffer.from(String(a), 'utf8')
  const y = Buffer.from(String(b), 'utf8')
  if (x.length !== y.length) return false
  return crypto.timingSafeEqual(x, y)
}

export function createSiteAuthRouter() {
  const router = Router()

  router.use(['/auth/site', '/auth/admin'], (_req, res, next) => {
    // Prevent stale auth status caching on Safari/iPad.
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    next()
  })

  router.get('/auth/site', (req, res) => {
    const cfg = getSitePasswordConfig()
    if (!cfg.required) {
      return res.json({ ok: true, required: false })
    }
    const token = readGateHeader(req) || readGateCookie(req) || readGateQuery(req)
    res.json({ ok: verifyGateToken(token), required: true })
  })

  router.post('/auth/site/login', (req, res) => {
    const cfg = getSitePasswordConfig()
    if (!cfg.required) {
      return res.json({ ok: true, token: null })
    }
    const submitted = req.body?.password
    if (typeof submitted !== 'string' || !constantTimeEqual(submitted, cfg.password)) {
      return res.status(401).json({ error: 'Incorrect password.' })
    }
    const token = createGateToken()
    setGateCookieHeader(res, token)
    res.json({ ok: true, token })
  })

  router.post('/auth/site/logout', (_req, res) => {
    clearGateCookieHeader(res)
    res.json({ ok: true })
  })

  router.get('/auth/admin', (req, res) => {
    const cfg = getAdminPasswordConfig()
    if (!cfg.required) {
      return res.json({ ok: true, required: false })
    }
    const token = readAdminGateHeader(req) || readAdminGateCookie(req) || readAdminGateQuery(req)
    res.json({ ok: verifyAdminGateToken(token), required: true })
  })

  router.post('/auth/admin/login', (req, res) => {
    const cfg = getAdminPasswordConfig()
    if (!cfg.required) {
      return res.json({ ok: true, token: null })
    }
    const submitted = req.body?.password
    if (typeof submitted !== 'string' || !constantTimeEqual(submitted, cfg.password)) {
      return res.status(401).json({ error: 'Incorrect password.' })
    }
    const token = createAdminGateToken()
    setAdminGateCookieHeader(res, token)
    res.json({ ok: true, token })
  })

  router.post('/auth/admin/logout', (_req, res) => {
    clearAdminGateCookieHeader(res)
    res.json({ ok: true })
  })

  return router
}
