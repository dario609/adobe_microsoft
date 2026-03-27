import fs from 'node:fs/promises'
import path from 'node:path'
import { projectRoot } from '../env.js'
import { ensureUploadsDir } from './bannerStore.js'

const LOG_PATH = path.join(projectRoot, 'server', 'uploads', 'upload-history.json')
const MAX_ITEMS = 250

async function readItems() {
  try {
    const raw = await fs.readFile(LOG_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeItems(items) {
  await ensureUploadsDir()
  await fs.writeFile(LOG_PATH, JSON.stringify(items, null, 2), 'utf8')
}

export async function appendUploadHistory(entry) {
  const prev = await readItems()
  const next = [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...entry }, ...prev]
  await writeItems(next.slice(0, MAX_ITEMS))
}

export async function listUploadHistory() {
  return readItems()
}
