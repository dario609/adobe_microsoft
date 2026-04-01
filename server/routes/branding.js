import { Router } from 'express'
import { getResolvedExperienceLogoForRead } from '../utils/experienceLogoStore.js'

export function createBrandingRouter() {
  const router = Router()

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
