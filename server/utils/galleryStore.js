import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { projectRoot } from '../env.js'
import { contentImageMeta } from './contentImageConfig.js'
import { getPublicContentSettings } from './publicConfig.js'

const GALLERY_DIR = path.join(projectRoot, 'server', 'uploads', 'gallery')
const MANIFEST = path.join(GALLERY_DIR, 'manifest.json')

async function ensureDir() {
  await fs.mkdir(GALLERY_DIR, { recursive: true })
}

/** @param {string | undefined} ext */
export function normalizeStoredExt(ext) {
  const x = String(ext || 'png').toLowerCase()
  if (x === 'jpeg' || x === 'jpg') return 'jpg'
  if (x === 'webp') return 'webp'
  return 'png'
}

async function readManifest() {
  try {
    const raw = await fs.readFile(MANIFEST, 'utf8')
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((it) => ({
      ...it,
      fileExt: normalizeStoredExt(it.fileExt),
    }))
  } catch {
    return []
  }
}

async function writeManifest(items) {
  await ensureDir()
  await fs.writeFile(MANIFEST, JSON.stringify(items, null, 2), 'utf8')
}

/**
 * @param {string} id
 * @param {string} [ext]
 */
export function getGalleryBlobPath(id, ext = 'png') {
  const safe = String(id || '').replace(/[^a-zA-Z0-9_-]/g, '')
  if (!safe) return ''
  const e = normalizeStoredExt(ext)
  return path.join(GALLERY_DIR, `${safe}.${e}`)
}

/** @deprecated use getGalleryBlobPath(id, ext) with manifest fileExt */
export function getGalleryFilePath(id) {
  return getGalleryBlobPath(id, 'png')
}

/** Adobe URNs can be long (e.g. brand templates with a path segment); do not truncate aggressively. */
export function normalizeTemplateId(v) {
  if (v == null) return ''
  const s = String(v).trim()
  if (!s) return ''
  return s.slice(0, 4096)
}

/** Canonical display name for uniqueness (matches persist rules). */
export function displayKey(name) {
  const s = String(name ?? '').trim().slice(0, 240)
  return s || 'image.png'
}

/**
 * @param {Array<{ id: string, originalName?: string, templateId?: string }>} items
 * @param {string | null} excludeId — skip this id (current item when updating)
 * @param {string} display
 * @param {string} templateId — normalized
 * @returns {{ field: 'originalName' | 'templateId', message: string } | null}
 */
export function findGalleryConflict(items, excludeId, display, templateId) {
  const tid = normalizeTemplateId(templateId)
  for (const x of items) {
    if (excludeId != null && x.id === excludeId) continue
    if (displayKey(x.originalName) === display) {
      return { field: 'originalName', message: 'Display name must be unique across gallery items.' }
    }
    if (tid && normalizeTemplateId(x.templateId) === tid) {
      return { field: 'templateId', message: 'This template ID is already used by another item.' }
    }
  }
  return null
}

export async function listGalleryItems() {
  return readManifest()
}

/** @param {Buffer} buffer @param {{ originalName: string, bytes: number, templateId?: string }} meta */
export async function addGalleryPng(buffer, meta) {
  await ensureDir()
  const id = crypto.randomUUID()
  const { contentImageMime } = getPublicContentSettings()
  const ext = contentImageMeta(contentImageMime).ext
  const p = getGalleryBlobPath(id, ext)
  if (!p) throw new Error('Invalid id')
  const originalName = displayKey(meta.originalName ?? 'image.png')
  const templateId = normalizeTemplateId(meta.templateId)
  if (!templateId) {
    const err = new Error('Template ID is required.')
    err.code = 'GALLERY_VALIDATION'
    throw err
  }
  const items = await readManifest()
  const conflict = findGalleryConflict(items, null, originalName, templateId)
  if (conflict) {
    const err = new Error(conflict.message)
    err.code = 'GALLERY_CONFLICT'
    err.field = conflict.field
    throw err
  }
  await fs.writeFile(p, buffer)
  const entry = {
    id,
    originalName,
    bytes: meta.bytes,
    uploadedAt: new Date().toISOString(),
    templateId,
    fileExt: ext,
  }
  items.unshift(entry)
  await writeManifest(items.slice(0, 500))
  return entry
}

export async function deleteGalleryItem(id) {
  const items = await readManifest()
  const next = items.filter((x) => x.id !== id)
  if (next.length === items.length) return false
  await writeManifest(next)
  const removed = items.find((x) => x.id === id)
  const ext = removed?.fileExt || 'png'
  try {
    await fs.unlink(getGalleryBlobPath(id, ext))
  } catch {
    /* noop */
  }
  return true
}

export async function getGalleryItem(id) {
  const items = await readManifest()
  return items.find((x) => x.id === id) || null
}

/** @param {string} id @param {{ templateId?: string, originalName?: string }} patch */
export async function updateGalleryItem(id, patch) {
  const items = await readManifest()
  const idx = items.findIndex((x) => x.id === id)
  if (idx < 0) return null
  const cur = items[idx]
  const next = { ...cur }
  if (patch.templateId !== undefined) {
    const tid = normalizeTemplateId(patch.templateId)
    if (!tid) {
      const err = new Error('Template ID is required.')
      err.code = 'GALLERY_VALIDATION'
      throw err
    }
    next.templateId = tid
  }
  if (patch.originalName !== undefined) next.originalName = displayKey(patch.originalName)
  const effectiveTid = normalizeTemplateId(next.templateId)
  if (!effectiveTid) {
    const err = new Error('Template ID is required.')
    err.code = 'GALLERY_VALIDATION'
    throw err
  }
  const conflict = findGalleryConflict(items, id, displayKey(next.originalName), next.templateId)
  if (conflict) {
    const err = new Error(conflict.message)
    err.code = 'GALLERY_CONFLICT'
    err.field = conflict.field
    throw err
  }
  items[idx] = next
  await writeManifest(items)
  return next
}

export async function replaceGalleryPng(id, buffer) {
  const items = await readManifest()
  const idx = items.findIndex((x) => x.id === id)
  if (idx < 0) return null
  const cur = items[idx]
  if (!normalizeTemplateId(cur.templateId)) {
    const err = new Error('Template ID is required for this item before replacing the image.')
    err.code = 'GALLERY_VALIDATION'
    throw err
  }
  const oldExt = normalizeStoredExt(cur.fileExt)
  const { contentImageMime } = getPublicContentSettings()
  const newExt = contentImageMeta(contentImageMime).ext
  const oldPath = getGalleryBlobPath(id, oldExt)
  const newPath = getGalleryBlobPath(id, newExt)
  await ensureDir()
  try {
    await fs.unlink(oldPath)
  } catch {
    /* may already match new path */
  }
  if (newPath !== oldPath) {
    try {
      await fs.unlink(newPath)
    } catch {
      /* noop */
    }
  }
  await fs.writeFile(newPath, buffer)
  const next = {
    ...cur,
    bytes: buffer.length,
    uploadedAt: new Date().toISOString(),
    fileExt: newExt,
  }
  items[idx] = next
  await writeManifest(items)
  return next
}
