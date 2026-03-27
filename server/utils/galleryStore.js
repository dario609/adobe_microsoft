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

export async function listGalleryItems() {
  return readManifest()
}

/** @param {Buffer} buffer @param {{ originalName: string, bytes: number }} meta */
export async function addGalleryPng(buffer, meta) {
  await ensureDir()
  const id = crypto.randomUUID()
  const p = getGalleryFilePath(id)
  if (!p) throw new Error('Invalid id')
  await fs.writeFile(p, buffer)
  const entry = {
    id,
    originalName: meta.originalName || 'image.png',
    bytes: meta.bytes,
    uploadedAt: new Date().toISOString(),
  }
  const items = await readManifest()
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
