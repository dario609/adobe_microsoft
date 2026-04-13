import { Router } from 'express'
import { uploadSessionBanner } from '../middleware/bannerUpload.js'
import { uploadExperienceLogo } from '../middleware/experienceLogoUpload.js'
import { uploadEditorWorkspaceBackground } from '../middleware/editorWorkspaceBackgroundUpload.js'
import { uploadLandingBackground } from '../middleware/landingBackgroundUpload.js'
import { uploadSessionHeaderBackground } from '../middleware/sessionHeaderBackgroundUpload.js'
import { requireAdminGate } from '../middleware/requireAdminGate.js'
import { deleteBanner, getResolvedBannerForRead, writeBannerPng } from '../utils/bannerStore.js'
import {
  deleteExperienceLogo,
  experienceLogoExists,
  writeExperienceLogo,
} from '../utils/experienceLogoStore.js'
import {
  deleteEditorWorkspaceBackground,
  writeEditorWorkspaceBackground,
} from '../utils/editorWorkspaceBackgroundStore.js'
import {
  deleteLandingBackground,
  writeLandingBackground,
} from '../utils/landingBackgroundStore.js'
import {
  deleteSessionHeaderBackground,
  writeSessionHeaderBackground,
} from '../utils/sessionHeaderBackgroundStore.js'
import { inferStoredExtFromUpload } from '../utils/contentImageConfig.js'
import { getUploadDestinationSettings } from '../utils/publicConfig.js'
import { readRuntimeConfigOverrides, writeRuntimeConfigOverrides } from '../utils/runtimeConfigStore.js'
import { listUploadHistory } from '../utils/uploadHistory.js'

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
        await writeBannerPng(buf, inferStoredExtFromUpload(req.file))
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
        await writeExperienceLogo(buf, inferStoredExtFromUpload(req.file))
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
        await writeLandingBackground(buf, inferStoredExtFromUpload(req.file))
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

  router.post('/admin/session-header-background', requireAdminGate, (req, res) => {
    uploadSessionHeaderBackground(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message || String(err) })
      const buf = req.file?.buffer
      const m = req.file?.mimetype
      if (!buf?.length || !m) {
        return res.status(400).json({ error: 'Missing file field "sessionHeaderBackground".' })
      }
      try {
        await writeSessionHeaderBackground(buf, inferStoredExtFromUpload(req.file))
        return res.json({ ok: true })
      } catch (e) {
        console.error('session header background save:', e)
        return res.status(500).json({ error: 'Could not save session header background.' })
      }
    })
  })

  router.delete('/admin/session-header-background', requireAdminGate, async (_req, res) => {
    await deleteSessionHeaderBackground()
    res.json({ ok: true })
  })

  router.post('/admin/editor-workspace-background', requireAdminGate, (req, res) => {
    uploadEditorWorkspaceBackground(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message || String(err) })
      const buf = req.file?.buffer
      const m = req.file?.mimetype
      if (!buf?.length || !m) {
        return res.status(400).json({ error: 'Missing file field "editorWorkspaceBackground".' })
      }
      try {
        await writeEditorWorkspaceBackground(buf, inferStoredExtFromUpload(req.file))
        return res.json({ ok: true })
      } catch (e) {
        console.error('editor workspace background save:', e)
        return res.status(500).json({ error: 'Could not save editor workspace background.' })
      }
    })
  })

  router.delete('/admin/editor-workspace-background', requireAdminGate, async (_req, res) => {
    await deleteEditorWorkspaceBackground()
    res.json({ ok: true })
  })

  router.get('/admin/uploads', async (_req, res) => {
    const items = await listUploadHistory()
    res.json({ items })
  })

  /** Upload destination (Dropbox vs SMB) — requires admin when admin password is enabled. */
  router.get('/admin/upload-storage', requireAdminGate, (_req, res) => {
    const o = readRuntimeConfigOverrides()
    const effective = getUploadDestinationSettings()
    const pw =
      o.smbPassword != null && String(o.smbPassword).length > 0
        ? String(o.smbPassword)
        : (process.env.SMB_PASSWORD || '')
    res.json({
      uploadDestination: effective.mode,
      smbHost: o.smbHost ?? process.env.SMB_HOST ?? '',
      smbShare: o.smbShare ?? process.env.SMB_SHARE ?? '',
      smbPathPrefix: o.smbPathPrefix ?? process.env.SMB_PATH_PREFIX ?? '',
      smbDomain: o.smbDomain ?? process.env.SMB_DOMAIN ?? '',
      smbUsername: o.smbUsername ?? process.env.SMB_USERNAME ?? '',
      smbPassword: pw,
      smbPasswordSet: pw.length > 0,
    })
  })

  router.post('/admin/upload-storage', requireAdminGate, (req, res) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    const patch = {}

    if (body.uploadDestination === 'dropbox' || body.uploadDestination === 'smb') {
      patch.uploadDestination = body.uploadDestination
    } else if (body.uploadDestination != null) {
      return res.status(400).json({ error: 'uploadDestination must be "dropbox" or "smb".' })
    }

    if (typeof body.smbHost === 'string') patch.smbHost = body.smbHost.trim().slice(0, 253)
    if (typeof body.smbShare === 'string') patch.smbShare = body.smbShare.trim().slice(0, 80)
    if (typeof body.smbPathPrefix === 'string') {
      patch.smbPathPrefix = body.smbPathPrefix.trim().replace(/\\/g, '/').slice(0, 500)
    }
    if (typeof body.smbDomain === 'string') patch.smbDomain = body.smbDomain.trim().slice(0, 120)
    if (typeof body.smbUsername === 'string') patch.smbUsername = body.smbUsername.trim().slice(0, 120)

    if (body.clearSmbPassword === true) patch.smbPassword = ''
    else if (typeof body.smbPassword === 'string' && body.smbPassword.trim()) {
      patch.smbPassword = body.smbPassword.trim().slice(0, 500)
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: 'No valid fields to save.' })
    }

    writeRuntimeConfigOverrides(patch)
    const o = readRuntimeConfigOverrides()
    const effective = getUploadDestinationSettings()
    const pw =
      o.smbPassword != null && String(o.smbPassword).length > 0
        ? String(o.smbPassword)
        : (process.env.SMB_PASSWORD || '')
    return res.json({
      ok: true,
      uploadDestination: effective.mode,
      smbHost: o.smbHost ?? process.env.SMB_HOST ?? '',
      smbShare: o.smbShare ?? process.env.SMB_SHARE ?? '',
      smbPathPrefix: o.smbPathPrefix ?? process.env.SMB_PATH_PREFIX ?? '',
      smbDomain: o.smbDomain ?? process.env.SMB_DOMAIN ?? '',
      smbUsername: o.smbUsername ?? process.env.SMB_USERNAME ?? '',
      smbPassword: pw,
      smbPasswordSet: pw.length > 0,
    })
  })

  return router
}
