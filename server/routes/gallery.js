import { Router } from 'express'
import fs from 'node:fs'
import { uploadGalleryPngs, uploadGalleryPngSingle } from '../middleware/galleryUpload.js'
import { extToMimeType, inferStoredExtFromUpload } from '../utils/contentImageConfig.js'
import {
  addGalleryPng,
  deleteGalleryItem,
  getGalleryBlobPath,
  getGalleryItem,
  listGalleryItems,
  normalizeGalleryTemplateType,
  normalizeTemplateId,
  replaceGalleryPng,
  updateGalleryItem,
} from '../utils/galleryStore.js'

function mapItem(it) {
  const tt = normalizeGalleryTemplateType(it.templateType)
  return {
    id: it.id,
    originalName: it.originalName,
    bytes: it.bytes,
    uploadedAt: it.uploadedAt,
    templateId: it.templateId || '',
    fileExt: it.fileExt || 'png',
    templateType: tt,
    canvasWidth: Number(it.canvasWidth) > 0 ? Number(it.canvasWidth) : 0,
    canvasHeight: Number(it.canvasHeight) > 0 ? Number(it.canvasHeight) : 0,
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

  router.get('/gallery/image/:id', async (req, res) => {
    try {
      const item = await getGalleryItem(req.params.id)
      if (!item) {
        return res.status(404).type('text').send('Not found.')
      }
      const ext = item.fileExt || 'png'
      const p = getGalleryBlobPath(req.params.id, ext)
      if (!p || !fs.existsSync(p)) {
        return res.status(404).type('text').send('Not found.')
      }
      res.setHeader('Cache-Control', 'public, max-age=120')
      res.type(extToMimeType(ext))
      return res.sendFile(p)
    } catch (e) {
      console.error('gallery image:', e)
      return res.status(500).type('text').send('Error.')
    }
  })

  router.post('/gallery', (req, res) => {
    uploadGalleryPngs(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || String(err) })
      }
      const files = req.files
      if (!Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: 'No image files uploaded (use field name "images").' })
      }
      const rawTt = req.body?.templateType
      const trimmedTt = rawTt != null ? String(rawTt).trim() : ''
      const uploadType = trimmedTt === '' ? null : normalizeGalleryTemplateType(rawTt)
      const templateIdRaw = req.body?.templateId
      const templateId =
        uploadType === 'blankCanvas' ? '' : normalizeTemplateId(templateIdRaw)
      if (uploadType !== 'blankCanvas' && !templateId) {
        return res.status(400).json({
          error: 'Template or project ID is required for Adobe and user / brand uploads.',
          code: 'TEMPLATE_ID_REQUIRED',
        })
      }
      const added = []
      try {
        for (const f of files) {
          const buf = f.buffer
          if (!buf?.length) continue
          const entry = await addGalleryPng(buf, {
            originalName: f.originalname || 'image.png',
            bytes: buf.length,
            templateId: uploadType === 'blankCanvas' ? '' : templateId,
            templateType: uploadType ?? undefined,
            canvasWidth: req.body?.canvasWidth,
            canvasHeight: req.body?.canvasHeight,
            fileExt: inferStoredExtFromUpload(f),
          })
          added.push(entry)
        }
        return res.json({ ok: true, items: added.map(mapItem) })
      } catch (e) {
        if (e?.code === 'GALLERY_CONFLICT') {
          return res.status(409).json({ error: e.message, field: e.field })
        }
        if (e?.code === 'GALLERY_VALIDATION') {
          return res.status(400).json({ error: e.message, code: e.code })
        }
        console.error('gallery upload:', e)
        return res.status(500).json({ error: 'Could not save gallery images.' })
      }
    })
  })

  async function handleGalleryMetaUpdate(req, res) {
    try {
      const { templateId, originalName, templateType, canvasWidth, canvasHeight } = req.body || {}
      const patch = {}
      if (templateId !== undefined) patch.templateId = templateId
      if (originalName !== undefined) patch.originalName = originalName
      if (templateType !== undefined) patch.templateType = templateType
      if (canvasWidth !== undefined) patch.canvasWidth = canvasWidth
      if (canvasHeight !== undefined) patch.canvasHeight = canvasHeight
      const updated = await updateGalleryItem(req.params.id, patch)
      if (!updated) return res.status(404).json({ error: 'Not found.' })
      return res.json({ ok: true, item: mapItem(updated) })
    } catch (e) {
      if (e?.code === 'GALLERY_CONFLICT') {
        return res.status(409).json({ error: e.message, field: e.field })
      }
      if (e?.code === 'GALLERY_VALIDATION') {
        return res.status(400).json({ error: e.message, code: e.code })
      }
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
        return res.status(400).json({ error: 'No image file (field name "image").' })
      }
      try {
        const updated = await replaceGalleryPng(req.params.id, buf, inferStoredExtFromUpload(req.file))
        if (!updated) return res.status(404).json({ error: 'Not found.' })
        return res.json({ ok: true, item: mapItem(updated) })
      } catch (e) {
        if (e?.code === 'GALLERY_VALIDATION') {
          return res.status(400).json({ error: e.message, code: e.code })
        }
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
