import { Router } from 'express'
import { requireSiteGate } from '../middleware/requireSiteGate.js'
import { uploadSessionBanner } from '../middleware/bannerUpload.js'
import { inferStoredExtFromUpload } from '../utils/contentImageConfig.js'
import { bannerExists, deleteBanner, getResolvedBannerForRead, writeBannerPng } from '../utils/bannerStore.js'

export function createBannerRouter() {
  const router = Router()

  // Admin endpoints (no password gate by request).
  router.get('/banner-admin', async (_req, res) => {
    const r = await getResolvedBannerForRead()
    if (!r) {
      return res.status(404).type('text').send('No banner uploaded.')
    }
    res.setHeader('Cache-Control', 'no-store')
    res.type(r.mime)
    return res.sendFile(r.path)
  })

  router.post('/banner-admin', (req, res) => {
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
        await writeBannerPng(buf, inferStoredExtFromUpload(req.file))
        return res.json({ ok: true })
      } catch (e) {
        console.error('Banner save:', e)
        return res.status(500).json({ error: 'Could not save banner.' })
      }
    })
  })

  router.delete('/banner-admin', async (_req, res) => {
    await deleteBanner()
    res.json({ ok: true })
  })

  router.get('/banner', requireSiteGate, async (_req, res) => {
    const r = await getResolvedBannerForRead()
    if (!r) {
      return res.status(404).type('text').send('No banner uploaded.')
    }
    res.setHeader('Cache-Control', 'public, max-age=60')
    res.type(r.mime)
    return res.sendFile(r.path, { maxAge: 60000 })
  })

  router.head('/banner', requireSiteGate, async (_req, res) => {
    const exists = await bannerExists()
    if (!exists) return res.status(404).end()
    return res.status(200).end()
  })

  router.get('/banner/meta', requireSiteGate, async (_req, res) => {
    const exists = await bannerExists()
    res.json({ exists })
  })

  router.post('/banner', requireSiteGate, (req, res) => {
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
        await writeBannerPng(buf, inferStoredExtFromUpload(req.file))
        return res.json({ ok: true })
      } catch (e) {
        console.error('Banner save:', e)
        return res.status(500).json({ error: 'Could not save banner.' })
      }
    })
  })

  router.delete('/banner', requireSiteGate, async (_req, res) => {
    await deleteBanner()
    res.json({ ok: true })
  })

  return router
}
