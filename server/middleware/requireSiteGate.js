import { getSitePasswordConfig } from '../utils/publicConfig.js'
import { readGateCookie, verifyGateToken } from '../utils/siteGateToken.js'

function readGateHeader(req) {
  const h = req.headers['x-site-token']
  if (typeof h === 'string') return h.trim()
  if (Array.isArray(h) && typeof h[0] === 'string') return h[0].trim()
  const auth = req.headers.authorization
  if (typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim()
  }
  return ''
}

export function requireSiteGate(req, res, next) {
  const { required } = getSitePasswordConfig()
  if (!required) return next()

  const cookieToken = readGateCookie(req)
  const headerToken = readGateHeader(req)
  if (verifyGateToken(cookieToken) || verifyGateToken(headerToken)) return next()

  return res.status(401).json({
    error: 'Sign in required. Refresh the page and enter the site password.',
    code: 'SITE_AUTH_REQUIRED',
  })
}
