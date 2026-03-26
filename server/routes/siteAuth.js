import crypto from 'node:crypto'
import { Router } from 'express'
import { getSitePasswordConfig } from '../utils/publicConfig.js'
import {
  clearGateCookieHeader,
  createGateToken,
  readGateCookie,
  setGateCookieHeader,
  verifyGateToken,
} from '../utils/siteGateToken.js'

function timingSafePassword(ok, attempt) {
  const a = Buffer.from(ok || '', 'utf8')
  const b = Buffer.from(attempt || '', 'utf8')
  if (a.length !== b.length) return false
  try {
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export function createSiteAuthRouter() {
  const router = Router()

  router.get('/auth/site', (_req, res) => {
    const { required } = getSitePasswordConfig()
    if (!required) {
      return res.json({ required: false, ok: true })
    }
    const token = readGateCookie(_req)
    const ok = verifyGateToken(token)
    return res.json({ required: true, ok })
  })

  router.post('/auth/site/login', (req, res) => {
    const { required, password } = getSitePasswordConfig()
    if (!required) {
      return res.json({ ok: true })
    }
    const attempt = typeof req.body?.password === 'string' ? req.body.password : ''
    if (!timingSafePassword(password, attempt)) {
      return res.status(401).json({ error: 'Incorrect password.' })
    }
    const token = createGateToken()
    setGateCookieHeader(res, token)
    // Return token so cross-site setups can use header auth (cookies may be blocked).
    return res.json({ ok: true, token })
  })

  router.post('/auth/site/logout', (_req, res) => {
    clearGateCookieHeader(res)
    return res.json({ ok: true })
  })

  return router
}
