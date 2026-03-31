import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { projectRoot } from '../env.js'

const GALLERY_DIR = path.join(projectRoot, 'server', 'uploads', 'gallery')
const MANIFEST = path.join(GALLERY_DIR, 'manifest.json')

async function ensureDir() {
  await fs.mkdir(GALLERY_DIR, { recursive: true })
}

async function readManifest() {
  try {
    const raw = await fs.readFile(MANIFEST, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeManifest(items) {
  await ensureDir()
  await fs.writeFile(MANIFEST, JSON.stringify(items, null, 2), 'utf8')
}

export function getGalleryFilePath(id) {
  const safe = String(id || '').replace(/[^a-zA-Z0-9_-]/g, '')
  if (!safe) return ''
  return path.join(GALLERY_DIR, `${safe}.png`)
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
  const p = getGalleryFilePath(id)
  if (!p) throw new Error('Invalid id')
  const originalName = displayKey(meta.originalName ?? 'image.png')
  const templateId = normalizeTemplateId(meta.templateId)
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
  try {
    await fs.unlink(getGalleryFilePath(id))
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
  if (patch.templateId !== undefined) next.templateId = normalizeTemplateId(patch.templateId)
  if (patch.originalName !== undefined) next.originalName = displayKey(patch.originalName)
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
  const p = getGalleryFilePath(id)
  if (!p) throw new Error('Invalid id')
  const items = await readManifest()
  const idx = items.findIndex((x) => x.id === id)
  if (idx < 0) return null
  await ensureDir()
  await fs.writeFile(p, buffer)
  const next = { ...items[idx], bytes: buffer.length, uploadedAt: new Date().toISOString() }
  items[idx] = next
  await writeManifest(items)
  return next
}
