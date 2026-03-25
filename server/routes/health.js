import { Router } from 'express'
import { getDropboxAuthMode, getDropboxClient } from '../dropbox/client.js'
import { OAUTH_DROPBOX_START } from '../config.js'
import { bannerExists } from '../utils/bannerStore.js'

export function createHealthRouter() {
  const router = Router()

  router.get('/health', async (_req, res) => {
    res.json({
      ok: true,
      sessionBanner: await bannerExists(),
      dropbox: Boolean(getDropboxClient()),
      dropboxAuthMode: getDropboxAuthMode(),
      oauthStartPath: OAUTH_DROPBOX_START,
    })
  })

  return router
}
