/**
 * Session timer + site gate — read from server env (operators restart API after .env changes).
 * Also accepts VITE_SESSION_SECONDS-style mistaken prefix via dropboxEnv pattern if needed; keep simple: SESSION_* only.
 */
import { readRuntimeConfigOverrides } from './runtimeConfigStore.js'

function truthyEnv(v) {
  if (v == null || v === '') return true
  const s = String(v).trim().toLowerCase()
  if (['0', 'false', 'no', 'off'].includes(s)) return false
  return true
}

function parseSessionSeconds(raw) {
  if (raw == null || String(raw).trim() === '') return 0
  const n = parseInt(String(raw).trim(), 10)
  if (!Number.isFinite(n) || n < 0) return 0
  return n
}

export function getSessionTimerPublicConfig() {
  const overrides = readRuntimeConfigOverrides()
  const raw =
    overrides.sessionSeconds != null
      ? String(overrides.sessionSeconds)
      : (process.env.SESSION_SECONDS?.trim() ??
    process.env.VITE_SESSION_SECONDS?.trim() ??
    '')
  const seconds = parseSessionSeconds(raw)
  const showFlag = process.env.SHOW_SESSION_TIMER
  const showSessionTimer = truthyEnv(showFlag) && seconds > 0
  return { sessionSeconds: seconds, showSessionTimer }
}

export function getSitePasswordConfig() {
  const overrides = readRuntimeConfigOverrides()
  const enabled = ['true', '1', 'yes', 'on'].includes(
    String(
      overrides.sitePasswordEnabled != null ? overrides.sitePasswordEnabled : process.env.SITE_PASSWORD_ENABLED || ''
    )
      .trim()
      .toLowerCase()
  )
  const password =
    overrides.siteAccessPassword != null ? overrides.siteAccessPassword : (process.env.SITE_ACCESS_PASSWORD ?? '')
  const required = enabled && password.length > 0
  return { enabled, required, password }
}

export function getAuthCookieSecret() {
  return (
    process.env.SITE_AUTH_SECRET?.trim() ||
    process.env.SITE_ACCESS_PASSWORD?.trim() ||
    'dev-only-set-SITE_AUTH_SECRET'
  )
}
