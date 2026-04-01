import { Router } from 'express'
import { createAdminRouter } from './admin.js'
import { createBannerRouter } from './banner.js'
import { createBrandingRouter } from './branding.js'
import { createGalleryRouter } from './gallery.js'
import { createHealthRouter } from './health.js'
import { createDropboxOauthRouter } from './oauth.js'
import { createPublicConfigRouter } from './publicConfig.js'
import { createSiteAuthRouter } from './siteAuth.js'
import { createUploadRouter } from './upload.js'

export function createApiRouter() {
  const api = Router()

  api.use(createHealthRouter())
  api.use(createGalleryRouter())
  api.use(createBrandingRouter())
  api.use(createAdminRouter())
  api.use(createPublicConfigRouter())
  api.use(createSiteAuthRouter())
  api.use(createBannerRouter())
  api.use(createDropboxOauthRouter())
  api.use(createUploadRouter())

  return api
}
