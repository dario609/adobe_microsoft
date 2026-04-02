import fs from 'node:fs/promises'
import path from 'node:path'
import { projectRoot } from '../env.js'
import { extToMimeType } from './contentImageConfig.js'

const UPLOADS_DIR = path.join(projectRoot, 'server', 'uploads')

export async function getResolvedLandingBackgroundForRead() {
  let files = []
  try {
    files = await fs.readdir(UPLOADS_DIR)
  } catch {
    return null
  }
  const hit = files.find((f) => f.startsWith('landing-background.'))
  if (!hit) return null
  const full = path.join(UPLOADS_DIR, hit)
  try {
    await fs.access(full)
  } catch {
    return null
  }
  const ext = path.extname(hit).replace(/^\./, '') || 'png'
  return { path: full, mime: extToMimeType(ext) }
}

/** @param {Buffer} buffer @param {'png'|'jpg'|'webp'} ext */
export async function writeLandingBackground(buffer, ext) {
  await fs.mkdir(UPLOADS_DIR, { recursive: true })
  const e = ext === 'jpg' || ext === 'jpeg' ? 'jpg' : ext === 'webp' ? 'webp' : 'png'
  const target = path.join(UPLOADS_DIR, `landing-background.${e}`)
  let files = []
  try {
    files = await fs.readdir(UPLOADS_DIR)
  } catch {
    files = []
  }
  for (const f of files) {
    if (!f.startsWith('landing-background.')) continue
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

export async function deleteLandingBackground() {
  let files = []
  try {
    files = await fs.readdir(UPLOADS_DIR)
  } catch {
    return
  }
  for (const f of files) {
    if (!f.startsWith('landing-background.')) continue
    try {
      await fs.unlink(path.join(UPLOADS_DIR, f))
    } catch {
      /* noop */
    }
  }
}
