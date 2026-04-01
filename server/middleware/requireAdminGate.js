import { readAdminGateCookie, readAdminGateHeader, verifyAdminGateToken } from '../utils/adminGateToken.js'
import { getAdminPasswordConfig } from '../utils/publicConfig.js'

/** When admin password is off, `/admin` is open — allow these routes without a token. */
export function requireAdminGate(req, res, next) {
  const cfg = getAdminPasswordConfig()
  if (!cfg.required) return next()

  const token = readAdminGateHeader(req) || readAdminGateCookie(req)
  if (!verifyAdminGateToken(token)) {
    return res.status(401).json({ error: 'Admin sign-in required.', code: 'ADMIN_AUTH_REQUIRED' })
  }
  next()
}
