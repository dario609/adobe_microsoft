import { Router } from 'express'
import { getResolvedExperienceLogoForRead } from '../utils/experienceLogoStore.js'
import { getResolvedLandingBackgroundForRead } from '../utils/landingBackgroundStore.js'

export function createBrandingRouter() {
  const router = Router()

  router.get('/branding/landing-background', async (_req, res) => {
    try {
      const r = await getResolvedLandingBackgroundForRead()
      if (!r) return res.status(404).end()
      res.setHeader('Cache-Control', 'public, max-age=120')
      res.type(r.mime)
      return res.sendFile(r.path)
    } catch (e) {
      console.error('landing background:', e)
      return res.status(500).end()
    }
  })

  router.get('/branding/experience-logo', async (_req, res) => {
    try {
      const r = await getResolvedExperienceLogoForRead()
      if (!r) {
        return res.status(404).end()
      }
      res.setHeader('Cache-Control', 'public, max-age=120')
      res.type(r.mime)
      return res.sendFile(r.path)
    } catch (e) {
      console.error('experience logo:', e)
      return res.status(500).end()
    }
  })

  return router
}
