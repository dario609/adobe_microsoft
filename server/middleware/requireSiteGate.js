import { getSitePasswordConfig } from '../utils/publicConfig.js'
import { readGateCookie, verifyGateToken } from '../utils/siteGateToken.js'

export function requireSiteGate(req, res, next) {
  const { required } = getSitePasswordConfig()
  if (!required) return next()

  const token = readGateCookie(req)
  if (verifyGateToken(token)) return next()

  return res.status(401).json({
    error: 'Sign in required. Refresh the page and enter the site password.',
    code: 'SITE_AUTH_REQUIRED',
  })
}
