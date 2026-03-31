import { Router } from 'express'
import fs from 'node:fs'
import { uploadGalleryPngs, uploadGalleryPngSingle } from '../middleware/galleryUpload.js'
import {
  addGalleryPng,
  deleteGalleryItem,
  getGalleryFilePath,
  listGalleryItems,
  normalizeTemplateId,
  replaceGalleryPng,
  updateGalleryItem,
} from '../utils/galleryStore.js'

function mapItem(it) {
  return {
    id: it.id,
    originalName: it.originalName,
    bytes: it.bytes,
    uploadedAt: it.uploadedAt,
    templateId: it.templateId || '',
  }
}

export function createGalleryRouter() {
  const router = Router()

  router.get('/gallery', async (_req, res) => {
    try {
      const items = await listGalleryItems()
      res.json({
        items: items.map(mapItem),
      })
    } catch (e) {
      console.error('gallery list:', e)
      res.status(500).json({ error: 'Could not list gallery.' })
    }
  })

  router.get('/gallery/image/:id', (req, res) => {
    const p = getGalleryFilePath(req.params.id)
    if (!p || !fs.existsSync(p)) {
      return res.status(404).type('text').send('Not found.')
    }
    res.setHeader('Cache-Control', 'public, max-age=120')
    res.type('png')
    return res.sendFile(p)
  })

  router.post('/gallery', (req, res) => {
    uploadGalleryPngs(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || String(err) })
      }
      const files = req.files
      if (!Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: 'No PNG files uploaded (use field name "images").' })
      }
      const templateId = normalizeTemplateId(req.body?.templateId)
      const added = []
      try {
        for (const f of files) {
          const buf = f.buffer
          if (!buf?.length) continue
          const entry = await addGalleryPng(buf, {
            originalName: f.originalname || 'image.png',
            bytes: buf.length,
            templateId,
          })
          added.push(entry)
        }
        return res.json({ ok: true, items: added.map(mapItem) })
      } catch (e) {
        console.error('gallery upload:', e)
        return res.status(500).json({ error: 'Could not save gallery images.' })
      }
    })
  })

  async function handleGalleryMetaUpdate(req, res) {
    try {
      const { templateId, originalName } = req.body || {}
      const patch = {}
      if (templateId !== undefined) patch.templateId = templateId
      if (originalName !== undefined) patch.originalName = originalName
      const updated = await updateGalleryItem(req.params.id, patch)
      if (!updated) return res.status(404).json({ error: 'Not found.' })
      return res.json({ ok: true, item: mapItem(updated) })
    } catch (e) {
      console.error('gallery meta update:', e)
      return res.status(500).json({ error: 'Could not update gallery item.' })
    }
  }

  /** PATCH — preferred */
  router.patch('/gallery/:id', handleGalleryMetaUpdate)
  /** POST alias (same body); use when PATCH is blocked or older proxies omit PATCH routes) */
  router.post('/gallery/:id/meta', handleGalleryMetaUpdate)

  router.post('/gallery/:id/replace', (req, res) => {
    uploadGalleryPngSingle(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || String(err) })
      }
      const buf = req.file?.buffer
      if (!buf?.length) {
        return res.status(400).json({ error: 'No PNG file (field name "image").' })
      }
      try {
        const updated = await replaceGalleryPng(req.params.id, buf)
        if (!updated) return res.status(404).json({ error: 'Not found.' })
        return res.json({ ok: true, item: mapItem(updated) })
      } catch (e) {
        console.error('gallery replace:', e)
        return res.status(500).json({ error: 'Could not replace image.' })
      }
    })
  })

  router.delete('/gallery/:id', async (req, res) => {
    const ok = await deleteGalleryItem(req.params.id)
    if (!ok) return res.status(404).json({ error: 'Not found.' })
    res.json({ ok: true })
  })

  return router
}
