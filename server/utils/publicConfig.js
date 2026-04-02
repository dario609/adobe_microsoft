/**
 * Session timer + site gate — read from server env (operators restart API after .env changes).
 * Also accepts VITE_SESSION_SECONDS-style mistaken prefix via dropboxEnv pattern if needed; keep simple: SESSION_* only.
 */
import { contentImageMeta, resolveContentImageMime } from './contentImageConfig.js'
import { readRuntimeConfigOverrides } from './runtimeConfigStore.js'

/** Shown after a successful design upload (overridable in admin / runtime config). */
export const DEFAULT_SUBMISSION_THANK_YOU_MESSAGE =
  'Thank you for your submission. Please see a brand ambassador for the current pickup wait time.'

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

export function getAdminPasswordConfig() {
  const overrides = readRuntimeConfigOverrides()
  const enabled = ['true', '1', 'yes', 'on'].includes(
    String(
      overrides.adminPasswordEnabled != null
        ? overrides.adminPasswordEnabled
        : process.env.ADMIN_PASSWORD_ENABLED || ''
    )
      .trim()
      .toLowerCase()
  )
  const password =
    overrides.adminAccessPassword != null
      ? overrides.adminAccessPassword
      : (process.env.ADMIN_ACCESS_PASSWORD ?? '')
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

/** Gallery + banner upload type + guest thank-you copy (runtime + env). */
export function getPublicContentSettings() {
  const overrides = readRuntimeConfigOverrides()
  const mime = resolveContentImageMime(overrides.contentImageMime)
  const meta = contentImageMeta(mime)
  const rawMsg = overrides.submissionThankYouMessage
  const trimmed = typeof rawMsg === 'string' ? rawMsg.trim() : ''
  const envMsg = process.env.SUBMISSION_THANK_YOU_MESSAGE?.trim() || ''
  const submissionThankYouMessage =
    trimmed || (envMsg ? envMsg.slice(0, 2000) : DEFAULT_SUBMISSION_THANK_YOU_MESSAGE)
  return {
    contentImageMime: mime,
    contentImageAccept: meta.accept,
    contentImageLabel: meta.label,
    submissionThankYouMessage,
  }
}

/**
 * Where guest design exports are written (Dropbox API vs SMB/CIFS via smbclient).
 * Runtime overrides env; password may come from SMB_PASSWORD env (not exposed to client).
 */
export function getUploadDestinationSettings() {
  const overrides = readRuntimeConfigOverrides()
  const envMode = String(process.env.UPLOAD_DESTINATION || '').trim().toLowerCase()
  const raw =
    overrides.uploadDestination != null && String(overrides.uploadDestination).trim() !== ''
      ? String(overrides.uploadDestination).trim().toLowerCase()
      : envMode
  const mode = raw === 'smb' ? 'smb' : 'dropbox'

  const pick = (key, envName) => {
    const v = overrides[key]
    if (v != null && String(v).trim() !== '') return String(v).trim()
    return String(process.env[envName] || '').trim()
  }

  if (mode !== 'smb') {
    return { mode: 'dropbox' }
  }

  return {
    mode: 'smb',
    smb: {
      host: pick('smbHost', 'SMB_HOST'),
      share: pick('smbShare', 'SMB_SHARE'),
      pathPrefix: pick('smbPathPrefix', 'SMB_PATH_PREFIX'),
      domain: pick('smbDomain', 'SMB_DOMAIN'),
      username: pick('smbUsername', 'SMB_USERNAME'),
      password: pick('smbPassword', 'SMB_PASSWORD'),
    },
  }
}
