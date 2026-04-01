import fs from 'node:fs/promises'
import path from 'node:path'
import { projectRoot } from '../env.js'
import { contentImageMeta, extToMimeType } from './contentImageConfig.js'
import { getPublicContentSettings } from './publicConfig.js'

const UPLOADS_DIR = path.join(projectRoot, 'server', 'uploads')
const LEGACY_BANNER = path.join(UPLOADS_DIR, 'session-banner.png')

/** Path for new uploads under current content-image policy. */
export function getBannerPath() {
  const { contentImageMime } = getPublicContentSettings()
  const ext = contentImageMeta(contentImageMime).ext
  return path.join(UPLOADS_DIR, `session-banner.${ext}`)
}

export async function ensureUploadsDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true })
}

/** Prefer current policy file; fall back to legacy fixed PNG name. */
export async function getResolvedBannerForRead() {
  const primary = getBannerPath()
  try {
    await fs.access(primary)
    const ext = path.extname(primary).replace(/^\./, '') || 'png'
    return { path: primary, mime: extToMimeType(ext) }
  } catch {
    /* try legacy */
  }
  try {
    await fs.access(LEGACY_BANNER)
    return { path: LEGACY_BANNER, mime: 'image/png' }
  } catch {
    return null
  }
}

export async function bannerExists() {
  const r = await getResolvedBannerForRead()
  return r != null
}

/** @param {Buffer} buffer */
export async function writeBannerPng(buffer) {
  await ensureUploadsDir()
  const target = getBannerPath()
  let files = []
  try {
    files = await fs.readdir(UPLOADS_DIR)
  } catch {
    files = []
  }
  for (const f of files) {
    if (!f.startsWith('session-banner.')) continue
    const full = path.join(UPLOADS_DIR, f)
    if (full !== target) {
      try {
        await fs.unlink(full)
      } catch {
        /* noop */
      }
    }
  }
  await fs.writeFile(target, buffer)
}

export async function deleteBanner() {
  let files = []
  try {
    files = await fs.readdir(UPLOADS_DIR)
  } catch {
    return
  }
  for (const f of files) {
    if (!f.startsWith('session-banner.')) continue
    try {
      await fs.unlink(path.join(UPLOADS_DIR, f))
    } catch {
      /* noop */
    }
  }
}
