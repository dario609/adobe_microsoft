import fs from 'node:fs/promises'
import path from 'node:path'
import { projectRoot } from '../env.js'
import { extToMimeType, sanitizeStoredFileExt } from './contentImageConfig.js'

const UPLOADS_DIR = path.join(projectRoot, 'server', 'uploads')
const LEGACY_BANNER = path.join(UPLOADS_DIR, 'session-banner.png')

export async function ensureUploadsDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true })
}

function bannerPathForExt(ext) {
  const e = sanitizeStoredFileExt(ext)
  return path.join(UPLOADS_DIR, `session-banner.${e}`)
}

export async function getResolvedBannerForRead() {
  let files = []
  try {
    files = await fs.readdir(UPLOADS_DIR)
  } catch {
    return null
  }
  const hit = files.find((f) => f.startsWith('session-banner.'))
  if (hit) {
    const full = path.join(UPLOADS_DIR, hit)
    try {
      await fs.access(full)
    } catch {
      return null
    }
    const ext = path.extname(hit).replace(/^\./, '') || 'png'
    return { path: full, mime: extToMimeType(ext) }
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

/** @param {Buffer} buffer @param {string} ext — from uploaded file */
export async function writeBannerPng(buffer, ext) {
  await ensureUploadsDir()
  const target = bannerPathForExt(ext)
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
