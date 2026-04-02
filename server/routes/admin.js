import { Router } from 'express'
import { uploadSessionBanner } from '../middleware/bannerUpload.js'
import { uploadExperienceLogo } from '../middleware/experienceLogoUpload.js'
import { uploadLandingBackground } from '../middleware/landingBackgroundUpload.js'
import { requireAdminGate } from '../middleware/requireAdminGate.js'
import { deleteBanner, getResolvedBannerForRead, writeBannerPng } from '../utils/bannerStore.js'
import {
  deleteExperienceLogo,
  experienceLogoExists,
  writeExperienceLogo,
} from '../utils/experienceLogoStore.js'
import {
  deleteLandingBackground,
  writeLandingBackground,
} from '../utils/landingBackgroundStore.js'
import { readRuntimeConfigOverrides } from '../utils/runtimeConfigStore.js'
import { listUploadHistory } from '../utils/uploadHistory.js'

function rasterExtFromMime(m) {
  if (m === 'image/jpeg') return 'jpg'
  if (m === 'image/webp') return 'webp'
  return 'png'
}

export function createAdminRouter() {
  const router = Router()

  // Intentionally no site-password middleware for operator screen.
  router.get('/admin/banner', async (_req, res) => {
    const r = await getResolvedBannerForRead()
    if (!r) return res.status(404).type('text').send('No banner uploaded.')
    res.setHeader('Cache-Control', 'no-store')
    res.type(r.mime)
    return res.sendFile(r.path)
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

  /** Sensitive: only with valid admin session token (same as admin panel). */
  router.get('/admin/operator-fields', requireAdminGate, (_req, res) => {
    const o = readRuntimeConfigOverrides()
    const envPw = process.env.ADMIN_ACCESS_PASSWORD?.trim() || ''
    const stored = o.adminAccessPassword != null ? String(o.adminAccessPassword) : ''
    res.json({
      adminAccessPassword: stored || envPw,
    })
  })

  router.get('/admin/experience-logo', requireAdminGate, async (_req, res) => {
    const exists = await experienceLogoExists()
    res.json({ exists })
  })

  router.post('/admin/experience-logo', requireAdminGate, (req, res) => {
    uploadExperienceLogo(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message || String(err) })
      const buf = req.file?.buffer
      if (!buf?.length) return res.status(400).json({ error: 'Missing file field "logo".' })
      try {
        await writeExperienceLogo(buf)
        return res.json({ ok: true })
      } catch (e) {
        console.error('experience logo save:', e)
        return res.status(500).json({ error: 'Could not save logo.' })
      }
    })
  })

  router.delete('/admin/experience-logo', requireAdminGate, async (_req, res) => {
    await deleteExperienceLogo()
    res.json({ ok: true })
  })

  router.post('/admin/landing-background', requireAdminGate, (req, res) => {
    uploadLandingBackground(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message || String(err) })
      const buf = req.file?.buffer
      const m = req.file?.mimetype
      if (!buf?.length || !m) return res.status(400).json({ error: 'Missing file field "background".' })
      try {
        await writeLandingBackground(buf, rasterExtFromMime(m))
        return res.json({ ok: true })
      } catch (e) {
        console.error('landing background save:', e)
        return res.status(500).json({ error: 'Could not save landing background.' })
      }
    })
  })

  router.delete('/admin/landing-background', requireAdminGate, async (_req, res) => {
    await deleteLandingBackground()
    res.json({ ok: true })
  })

  router.get('/admin/uploads', async (_req, res) => {
    const items = await listUploadHistory()
    res.json({ items })
  })

  return router
}
