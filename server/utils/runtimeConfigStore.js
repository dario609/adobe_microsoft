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
