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
      const tt = it.templateType || templateSource.type
      const cw = parseInt(String(it.canvasWidth ?? ''), 10)
      const ch = parseInt(String(it.canvasHeight ?? ''), 10)
      return {
        ...it,
        fileExt: normalizeStoredExt(it.fileExt),
        templateId: tt === 'blankCanvas' ? '' : normalizedId,
        templateType: tt,
        canvasWidth: Number.isFinite(cw) && cw > 0 ? cw : 0,
        canvasHeight: Number.isFinite(ch) && ch > 0 ? ch : 0,
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

/** @param {unknown} v */
export function normalizeGalleryTemplateType(v) {
  const s = String(v ?? '').trim()
  if (s === 'userTemplate' || s === 'user') return 'userTemplate'
  if (s === 'blankCanvas' || s === 'blank') return 'blankCanvas'
  return 'adobeTemplate'
}

export const CANVAS_DIM_MIN = 1
export const CANVAS_DIM_MAX = 8192

/** @param {unknown} v @returns {number | null} */
export function parseCanvasDimension(v) {
  const n = parseInt(String(v ?? '').trim(), 10)
  if (!Number.isFinite(n) || n < CANVAS_DIM_MIN || n > CANVAS_DIM_MAX) return null
  return n
}

/**
 * @param {string} v
 * @returns {{ type: 'adobeTemplate' | 'userTemplate', id: string }}
 */
const EXPRESS_PROJECT_PATH = /\/project\/([^/?#]+)/i
/** Standalone project UUIDs (from share links) open with editor.edit, not createWithTemplate. */
const PROJECT_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function parseTemplateSource(v) {
  if (v == null) return { type: 'adobeTemplate', id: '' }
  const s = String(v).trim()
  if (!s) return { type: 'adobeTemplate', id: '' }

  if (PROJECT_UUID_RE.test(s)) {
    return { type: 'userTemplate', id: s }
  }

  const isUserTemplate =
    s.includes('/design/userTemplate/') ||
    /\buserTemplate\b/i.test(s) ||
    /express\.adobe\.com\/[^?\s]*\/project\//i.test(s) ||
    /new\.express\.adobe\.com\/[^?\s]*\/project\//i.test(s) ||
    EXPRESS_PROJECT_PATH.test(s) ||
    /\/project\/[a-z0-9-]+\/edit/i.test(s)

  const id = normalizeTemplateId(s)

  return {
    type: isUserTemplate ? 'userTemplate' : 'adobeTemplate',
    id,
  }
}

/** Canonical display name for uniqueness (matches persist rules). */
export function displayKey(name) {
  const s = String(name ?? '').trim().slice(0, 240)
  return s || 'image.png'
}

/**
 * @param {Array<{ id: string, originalName?: string, templateId?: string, templateType?: string }>} items
 * @param {string | null} excludeId — skip this id (current item when updating)
 * @param {string} display
 * @param {string} templateId — normalized
 * @param {string} [templateType]
 * @returns {{ field: string, message: string } | null}
 */
export function findGalleryConflict(items, excludeId, display, templateId, templateType = 'adobeTemplate') {
  const tt = normalizeGalleryTemplateType(templateType)
  if (tt === 'blankCanvas') {
    for (const x of items) {
      if (excludeId != null && x.id === excludeId) continue
      if (displayKey(x.originalName) === display) {
        return { field: 'originalName', message: 'Display name must be unique across gallery items.' }
      }
    }
    return null
  }

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

/**
 * @param {Buffer} buffer
 * @param {{
 *   originalName: string
 *   bytes: number
 *   templateId?: string
 *   fileExt: string
 *   templateType?: string
 *   canvasWidth?: unknown
 *   canvasHeight?: unknown
 * }} meta
 */
export async function addGalleryPng(buffer, meta) {
  await ensureDir()
  const id = crypto.randomUUID()
  const ext = normalizeStoredExt(meta.fileExt)
  const p = getGalleryBlobPath(id, ext)
  if (!p) throw new Error('Invalid id')
  const originalName = displayKey(meta.originalName ?? 'image.png')

  const explicitType =
    meta.templateType != null && String(meta.templateType).trim() !== ''
      ? normalizeGalleryTemplateType(meta.templateType)
      : null
  const inferred = parseTemplateSource(meta.templateId)
  /** User/Adobe distinction always comes from the ID/URL (not client dropdown). */
  let resolvedType = inferred.type
  if (explicitType === 'blankCanvas') {
    resolvedType = 'blankCanvas'
  }

  let templateId = ''
  let canvasWidth = 0
  let canvasHeight = 0

  if (resolvedType === 'blankCanvas') {
    const w = parseCanvasDimension(meta.canvasWidth)
    const h = parseCanvasDimension(meta.canvasHeight)
    if (w == null || h == null) {
      const err = new Error('Blank canvas requires width and height between 1 and 8192 px.')
      err.code = 'GALLERY_VALIDATION'
      throw err
    }
    canvasWidth = w
    canvasHeight = h
    templateId = ''
  } else {
    templateId = normalizeTemplateId(meta.templateId)
    if (!templateId) {
      const err = new Error('Template ID is required for Adobe and user / brand projects.')
      err.code = 'GALLERY_VALIDATION'
      throw err
    }
  }

  const items = await readManifest()
  const conflict = findGalleryConflict(
    items,
    null,
    originalName,
    resolvedType === 'blankCanvas' ? '' : templateId,
    resolvedType
  )
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
    templateType:
      resolvedType === 'blankCanvas'
        ? 'blankCanvas'
        : resolvedType === 'userTemplate'
          ? 'userTemplate'
          : 'adobeTemplate',
    canvasWidth,
    canvasHeight,
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

/**
 * @param {string} id
 * @param {{
 *   templateId?: string
 *   originalName?: string
 *   templateType?: string
 *   canvasWidth?: unknown
 *   canvasHeight?: unknown
 * }} patch
 */
export async function updateGalleryItem(id, patch) {
  const items = await readManifest()
  const idx = items.findIndex((x) => x.id === id)
  if (idx < 0) return null
  const cur = items[idx]
  const next = { ...cur }

  if (patch.templateType !== undefined) {
    next.templateType = normalizeGalleryTemplateType(patch.templateType)
  }
  if (patch.canvasWidth !== undefined) {
    const w = parseCanvasDimension(patch.canvasWidth)
    next.canvasWidth = w == null ? 0 : w
  }
  if (patch.canvasHeight !== undefined) {
    const h = parseCanvasDimension(patch.canvasHeight)
    next.canvasHeight = h == null ? 0 : h
  }
  if (patch.templateId !== undefined) {
    next.templateId = normalizeTemplateId(patch.templateId)
  }
  if (patch.originalName !== undefined) next.originalName = displayKey(patch.originalName)

  const tid = normalizeTemplateId(next.templateId)

  if (tid) {
    next.templateId = tid
    next.templateType = parseTemplateSource(tid).type
    next.canvasWidth = 0
    next.canvasHeight = 0
  } else if (normalizeGalleryTemplateType(next.templateType) === 'blankCanvas') {
    const w = parseCanvasDimension(next.canvasWidth)
    const h = parseCanvasDimension(next.canvasHeight)
    if (w == null || h == null) {
      const err = new Error('Blank canvas requires width and height between 1 and 8192 px.')
      err.code = 'GALLERY_VALIDATION'
      throw err
    }
    next.canvasWidth = w
    next.canvasHeight = h
    next.templateId = ''
    next.templateType = 'blankCanvas'
  } else {
    const err = new Error('Template or project ID is required.')
    err.code = 'GALLERY_VALIDATION'
    throw err
  }

  const conflict = findGalleryConflict(
    items,
    id,
    displayKey(next.originalName),
    next.templateType === 'blankCanvas' ? '' : next.templateId,
    next.templateType
  )
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
  if (normalizeGalleryTemplateType(cur.templateType) !== 'blankCanvas' && !normalizeTemplateId(cur.templateId)) {
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
