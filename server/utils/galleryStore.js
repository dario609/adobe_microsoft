import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { projectRoot } from '../env.js'
import { sanitizeStoredFileExt } from './contentImageConfig.js'

const GALLERY_DIR = path.join(projectRoot, 'server', 'uploads', 'gallery')
const MANIFEST = path.join(GALLERY_DIR, 'manifest.json')

async function ensureDir() {
  await fs.mkdir(GALLERY_DIR, { recursive: true })
}

/** @param {string | undefined} ext */
export function normalizeStoredExt(ext) {
  return sanitizeStoredFileExt(ext)
}

async function readManifest() {
  try {
    const raw = await fs.readFile(MANIFEST, 'utf8')
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((it) => {
      const normalizedId = normalizeTemplateId(it.templateId)
      const templateSource = parseTemplateSource(it.templateId || '')
      return {
        ...it,
        fileExt: normalizeStoredExt(it.fileExt),
        templateId: normalizedId,
        templateType: it.templateType || templateSource.type, // Migrate existing items
      }
    })
  } catch {
    return []
  }
}

async function writeManifest(items) {
  await ensureDir()
  await fs.writeFile(MANIFEST, JSON.stringify(items, null, 2), 'utf8')
}

/** Migrate existing gallery items to include templateType */
export async function migrateGalleryManifest() {
  try {
    // On first run, manifest doesn't exist yet—this is normal
    let raw
    try {
      raw = await fs.readFile(MANIFEST, 'utf8')
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log('No existing gallery manifest (first run)')
        return
      }
      throw err
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return
    let migrated = false
    const migratedItems = parsed.map((it) => {
      if (!it.templateType && it.templateId) {
        const templateSource = parseTemplateSource(it.templateId)
        migrated = true
        console.log(`Migrating item ${it.id}: templateType=${templateSource.type}`)
        return { 
          ...it, 
          fileExt: normalizeStoredExt(it.fileExt),
          templateId: normalizeTemplateId(it.templateId),
          templateType: templateSource.type 
        }
      }
      return {
        ...it,
        fileExt: normalizeStoredExt(it.fileExt),
        templateId: normalizeTemplateId(it.templateId),
        templateType: it.templateType || parseTemplateSource(it.templateId).type
      }
    })
    if (migrated) {
      await writeManifest(migratedItems)
      console.log(`Migrated ${migratedItems.length} gallery items to include templateType`)
    } else {
      console.log('No migration needed')
    }
  } catch (err) {
    console.error('Migration failed:', err)
  }
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

/**
 * Adobe URNs can be long (e.g. brand templates with a path segment);
 * normalize URLs or shared links to the actual template URN when possible.
 */
const TEMPLATE_ID_QUERY_REGEX = /[?&]templateId=([^&]+)/i
const TEMPLATE_URN_REGEX = /urn:aaid:[^?\s"'<>]+/i

export function normalizeTemplateId(v) {
  if (v == null) return ''
  let s = String(v).trim()
  if (!s) return ''

  const queryMatch = s.match(TEMPLATE_ID_QUERY_REGEX)
  if (queryMatch && queryMatch[1]) {
    try {
      s = decodeURIComponent(queryMatch[1])
    } catch {
      s = queryMatch[1]
    }
  }

  const urnMatch = s.match(TEMPLATE_URN_REGEX)
  if (urnMatch) {
    s = urnMatch[0]
  }

  return s.slice(0, 4096)
}

/**
 * @param {string} v
 * @returns {{ type: 'adobeTemplate' | 'userTemplate', id: string }}
 */
export function parseTemplateSource(v) {
  if (v == null) return { type: 'adobeTemplate', id: '' }
  const s = String(v).trim()
  if (!s) return { type: 'adobeTemplate', id: '' }

  // Check if it's a userTemplate URL
  if (s.includes('/design/userTemplate/')) {
    const id = normalizeTemplateId(s)
    return { type: 'userTemplate', id }
  }

  // Default to adobeTemplate
  const id = normalizeTemplateId(s)
  return { type: 'adobeTemplate', id }
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

/** @param {Buffer} buffer @param {{ originalName: string, bytes: number, templateId?: string, fileExt: string }} meta */
export async function addGalleryPng(buffer, meta) {
  await ensureDir()
  const id = crypto.randomUUID()
  const ext = normalizeStoredExt(meta.fileExt)
  const p = getGalleryBlobPath(id, ext)
  if (!p) throw new Error('Invalid id')
  const originalName = displayKey(meta.originalName ?? 'image.png')
  const templateSource = parseTemplateSource(meta.templateId)
  if (!templateSource.id) {
    const err = new Error('Template ID is required.')
    err.code = 'GALLERY_VALIDATION'
    throw err
  }
  const items = await readManifest()
  const conflict = findGalleryConflict(items, null, originalName, templateSource.id)
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
    templateId: templateSource.id,
    templateType: templateSource.type,
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
    const templateSource = parseTemplateSource(patch.templateId)
    if (!templateSource.id) {
      const err = new Error('Template ID is required.')
      err.code = 'GALLERY_VALIDATION'
      throw err
    }
    next.templateId = templateSource.id
    next.templateType = templateSource.type
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

export async function replaceGalleryPng(id, buffer, newExt) {
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
  const nextExt = normalizeStoredExt(newExt)
  const oldPath = getGalleryBlobPath(id, oldExt)
  const newPath = getGalleryBlobPath(id, nextExt)
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
    fileExt: nextExt,
  }
  items[idx] = next
  await writeManifest(items)
  return next
}
