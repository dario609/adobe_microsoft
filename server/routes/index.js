import { Router } from 'express'
import { createBannerRouter } from './banner.js'
import { createHealthRouter } from './health.js'
import { createDropboxOauthRouter } from './oauth.js'
import { createUploadRouter } from './upload.js'

export function createApiRouter() {
  const api = Router()

  api.use(createHealthRouter())
  api.use(createBannerRouter())
  api.use(createDropboxOauthRouter())
  api.use(createUploadRouter())

  return api
}
