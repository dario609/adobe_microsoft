import fs from 'node:fs'
import path from 'node:path'
import { projectRoot } from '../env.js'

const RUNTIME_DIR = path.join(projectRoot, 'server', 'data')
const RUNTIME_FILE = path.join(RUNTIME_DIR, 'runtime-config.json')

const EMPTY = {
  sessionSeconds: null,
  sitePasswordEnabled: null,
  siteAccessPassword: null,
  adminPasswordEnabled: null,
  adminAccessPassword: null,
  contentImageMime: null,
  submissionThankYouMessage: null,
  uploadDestination: null,
  smbHost: null,
  smbShare: null,
  smbPathPrefix: null,
  smbDomain: null,
  smbUsername: null,
  smbPassword: null,
}

function normalize(raw) {
  const out = { ...EMPTY }
  if (raw && typeof raw === 'object') {
    if (raw.sessionSeconds == null) out.sessionSeconds = null
    else {
      const n = parseInt(String(raw.sessionSeconds), 10)
      out.sessionSeconds = Number.isFinite(n) && n >= 0 ? n : 0
    }
    if (raw.sitePasswordEnabled == null) out.sitePasswordEnabled = null
    else out.sitePasswordEnabled = Boolean(raw.sitePasswordEnabled)
    if (raw.siteAccessPassword == null) out.siteAccessPassword = null
    else out.siteAccessPassword = String(raw.siteAccessPassword)
    if (raw.adminPasswordEnabled == null) out.adminPasswordEnabled = null
    else out.adminPasswordEnabled = Boolean(raw.adminPasswordEnabled)
    if (raw.adminAccessPassword == null) out.adminAccessPassword = null
    else out.adminAccessPassword = String(raw.adminAccessPassword)
    if (raw.contentImageMime == null) out.contentImageMime = null
    else out.contentImageMime = String(raw.contentImageMime).trim() || null
    if (raw.submissionThankYouMessage == null) out.submissionThankYouMessage = null
    else out.submissionThankYouMessage = String(raw.submissionThankYouMessage).slice(0, 2000)
    if (raw.uploadDestination == null) out.uploadDestination = null
    else {
      const u = String(raw.uploadDestination).trim().toLowerCase()
      out.uploadDestination = u === 'smb' ? 'smb' : u === 'dropbox' ? 'dropbox' : null
    }
    if (raw.smbHost == null) out.smbHost = null
    else out.smbHost = String(raw.smbHost).trim().slice(0, 253)
    if (raw.smbShare == null) out.smbShare = null
    else out.smbShare = String(raw.smbShare).trim().slice(0, 80)
    if (raw.smbPathPrefix == null) out.smbPathPrefix = null
    else out.smbPathPrefix = String(raw.smbPathPrefix).trim().replace(/\\/g, '/').slice(0, 500)
    if (raw.smbDomain == null) out.smbDomain = null
    else out.smbDomain = String(raw.smbDomain).trim().slice(0, 120)
    if (raw.smbUsername == null) out.smbUsername = null
    else out.smbUsername = String(raw.smbUsername).trim().slice(0, 120)
    if (raw.smbPassword == null) out.smbPassword = null
    else out.smbPassword = String(raw.smbPassword).slice(0, 500)
  }
  return out
}

export function readRuntimeConfigOverrides() {
  try {
    const text = fs.readFileSync(RUNTIME_FILE, 'utf8')
    return normalize(JSON.parse(text))
  } catch {
    return { ...EMPTY }
  }
}

export function writeRuntimeConfigOverrides(patch) {
  const current = readRuntimeConfigOverrides()
  const merged = normalize({ ...current, ...patch })
  fs.mkdirSync(RUNTIME_DIR, { recursive: true })
  fs.writeFileSync(RUNTIME_FILE, JSON.stringify(merged, null, 2) + '\n', 'utf8')
  return merged
}
