import { Router } from 'express'
import fs from 'node:fs'
import { uploadSessionBanner } from '../middleware/bannerUpload.js'
import { deleteBanner, getBannerPath, writeBannerPng } from '../utils/bannerStore.js'
import { listUploadHistory } from '../utils/uploadHistory.js'

export function createAdminRouter() {
  const router = Router()

  // Intentionally no site-password middleware for operator screen.
  router.get('/admin/banner', (_req, res) => {
    const p = getBannerPath()
    if (!fs.existsSync(p)) return res.status(404).type('text').send('No banner uploaded.')
    res.setHeader('Cache-Control', 'no-store')
    res.type('png')
    return res.sendFile(p)
  })

  router.post('/admin/banner', (req, res) => {
    uploadSessionBanner(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message || String(err) })
      const buf = req.file?.buffer
      if (!buf?.length) return res.status(400).json({ error: 'Missing file field "banner".' })
      try {
        await writeBannerPng(buf)
        return res.json({ ok: true })
      } catch {
        return res.status(500).json({ error: 'Could not save banner.' })
      }
    })
  })

  router.delete('/admin/banner', async (_req, res) => {
    await deleteBanner()
    res.json({ ok: true })
  })

  router.get('/admin/uploads', async (_req, res) => {
    const items = await listUploadHistory()
    res.json({ items })
  })

  return router
}
