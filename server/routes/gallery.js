import { Router } from 'express'
import fs from 'node:fs'
import { uploadGalleryPngs } from '../middleware/galleryUpload.js'
import { addGalleryPng, deleteGalleryItem, getGalleryFilePath, listGalleryItems } from '../utils/galleryStore.js'

export function createGalleryRouter() {
  const router = Router()

  router.get('/gallery', async (_req, res) => {
    try {
      const items = await listGalleryItems()
      res.json({
        items: items.map((it) => ({
          id: it.id,
          originalName: it.originalName,
          bytes: it.bytes,
          uploadedAt: it.uploadedAt,
        })),
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
      const added = []
      try {
        for (const f of files) {
          const buf = f.buffer
          if (!buf?.length) continue
          const entry = await addGalleryPng(buf, {
            originalName: f.originalname || 'image.png',
            bytes: buf.length,
          })
          added.push(entry)
        }
        return res.json({ ok: true, items: added })
      } catch (e) {
        console.error('gallery upload:', e)
        return res.status(500).json({ error: 'Could not save gallery images.' })
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
