import { getSitePasswordConfig } from '../utils/publicConfig.js'
import { readGateCookie, readGateHeader, readGateQuery, verifyGateToken } from '../utils/siteGateToken.js'

export function requireSiteGate(req, res, next) {
  const { required } = getSitePasswordConfig()
  if (!required) return next()

  const token = readGateHeader(req) || readGateCookie(req) || readGateQuery(req)
  if (verifyGateToken(token)) return next()

  return res.status(401).json({ error: 'Site password required.', code: 'SITE_AUTH_REQUIRED' })
}
