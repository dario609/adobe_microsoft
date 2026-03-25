import fs from 'node:fs/promises'
import path from 'node:path'
import { projectRoot } from '../env.js'

const UPLOADS_DIR = path.join(projectRoot, 'server', 'uploads')
const BANNER_FILENAME = 'session-banner.png'

export function getBannerPath() {
  return path.join(UPLOADS_DIR, BANNER_FILENAME)
}

export async function ensureUploadsDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true })
}

export async function bannerExists() {
  try {
    await fs.access(getBannerPath())
    return true
  } catch {
    return false
  }
}

/** @param {Buffer} buffer */
export async function writeBannerPng(buffer) {
  await ensureUploadsDir()
  await fs.writeFile(getBannerPath(), buffer)
}

export async function deleteBanner() {
  try {
    await fs.unlink(getBannerPath())
  } catch {
    /* noop */
  }
}
