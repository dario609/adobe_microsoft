import { Router } from 'express'
import { getDropboxAuthMode, getDropboxClient } from '../dropbox/client.js'
import { OAUTH_DROPBOX_START } from '../config.js'

export function createHealthRouter() {
  const router = Router()

  router.get('/health', (_req, res) => {
    res.json({
      ok: true,
      dropbox: Boolean(getDropboxClient()),
      dropboxAuthMode: getDropboxAuthMode(),
      oauthStartPath: OAUTH_DROPBOX_START,
    })
  })

  return router
}
