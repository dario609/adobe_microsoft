import { Router } from 'express'
import { getDropboxAuthMode, getDropboxClient } from '../dropbox/client.js'
import { OAUTH_DROPBOX_START } from '../config.js'
import { bannerExists } from '../utils/bannerStore.js'
import { getSessionTimerPublicConfig, getSitePasswordConfig } from '../utils/publicConfig.js'

export function createHealthRouter() {
  const router = Router()

  router.get('/health', async (_req, res) => {
    const timer = getSessionTimerPublicConfig()
    const gate = getSitePasswordConfig()
    res.json({
      ok: true,
      sessionBanner: await bannerExists(),
      sessionTimer: timer,
      sitePasswordRequired: gate.required,
      dropbox: Boolean(getDropboxClient()),
      dropboxAuthMode: getDropboxAuthMode(),
      oauthStartPath: OAUTH_DROPBOX_START,
    })
  })

  return router
}
