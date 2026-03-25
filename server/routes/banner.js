import { Router } from 'express'
import fs from 'node:fs'
import { uploadSessionBanner } from '../middleware/bannerUpload.js'
import { bannerExists, deleteBanner, getBannerPath, writeBannerPng } from '../utils/bannerStore.js'

export function createBannerRouter() {
  const router = Router()

  router.get('/banner', (_req, res) => {
    const p = getBannerPath()
    if (!fs.existsSync(p)) {
      return res.status(404).type('text').send('No banner uploaded.')
    }
    res.setHeader('Cache-Control', 'public, max-age=60')
    res.type('png')
    return res.sendFile(p, { maxAge: 60000 })
  })

  router.head('/banner', async (_req, res) => {
    const exists = await bannerExists()
    if (!exists) return res.status(404).end()
    return res.status(200).end()
  })

  router.get('/banner/meta', async (_req, res) => {
    const exists = await bannerExists()
    res.json({ exists })
  })

  router.post('/banner', (req, res) => {
    uploadSessionBanner(req, res, async (err) => {
      if (err) {
        const msg = err.message || String(err)
        return res.status(400).json({ error: msg })
      }
      const buf = req.file?.buffer
      if (!buf?.length) {
        return res.status(400).json({ error: 'Missing file field "banner".' })
      }
      try {
        await writeBannerPng(buf)
        return res.json({ ok: true })
      } catch (e) {
        console.error('Banner save:', e)
        return res.status(500).json({ error: 'Could not save banner.' })
      }
    })
  })

  router.delete('/banner', async (_req, res) => {
    await deleteBanner()
    res.json({ ok: true })
  })

  return router
}
