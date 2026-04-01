import fs from 'node:fs/promises'
import path from 'node:path'
import { projectRoot } from '../env.js'
import { contentImageMeta, extToMimeType } from './contentImageConfig.js'
import { getPublicContentSettings } from './publicConfig.js'

const UPLOADS_DIR = path.join(projectRoot, 'server', 'uploads')

function logoBasename() {
  const { contentImageMime } = getPublicContentSettings()
  return `experience-logo.${contentImageMeta(contentImageMime).ext}`
}

export function getExperienceLogoPath() {
  return path.join(UPLOADS_DIR, logoBasename())
}

export async function experienceLogoExists() {
  return (await getResolvedExperienceLogoForRead()) != null
}

/** @returns {{ path: string, mime: string } | null} */
export async function getResolvedExperienceLogoForRead() {
  const dir = UPLOADS_DIR
  let files = []
  try {
    files = await fs.readdir(dir)
  } catch {
    return null
  }
  const candidates = files.filter((f) => f.startsWith('experience-logo.'))
  if (candidates.length === 0) return null
  const name = candidates.includes(logoBasename()) ? logoBasename() : candidates[0]
  const full = path.join(dir, name)
  try {
    await fs.access(full)
  } catch {
    return null
  }
  const ext = path.extname(name).replace(/^\./, '') || 'png'
  return { path: full, mime: extToMimeType(ext) }
}

/** @param {Buffer} buffer */
export async function writeExperienceLogo(buffer) {
  await fs.mkdir(UPLOADS_DIR, { recursive: true })
  const target = getExperienceLogoPath()
  let files = []
  try {
    files = await fs.readdir(UPLOADS_DIR)
  } catch {
    files = []
  }
  for (const f of files) {
    if (!f.startsWith('experience-logo.')) continue
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

export async function deleteExperienceLogo() {
  let files = []
  try {
    files = await fs.readdir(UPLOADS_DIR)
  } catch {
    return
  }
  for (const f of files) {
    if (!f.startsWith('experience-logo.')) continue
    try {
      await fs.unlink(path.join(UPLOADS_DIR, f))
    } catch {
      /* noop */
    }
  }
}
