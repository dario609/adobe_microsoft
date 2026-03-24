import { Router } from 'express'
import { exchangeCodeForTokens, getAuthorizeUrl } from '../dropbox/oauth.js'
import { exchangeSuccessPlainText, noRefreshTokenHtml } from '../dropbox/oauthViews.js'

export function createDropboxOauthRouter() {
  const router = Router()

  router.get('/oauth/dropbox/start', (_req, res) => {
    try {
      res.redirect(getAuthorizeUrl())
    } catch (err) {
      res.status(500).type('text').send(String(err?.message || err))
    }
  })

  router.get('/oauth/dropbox/callback', async (req, res) => {
    const oauthError = req.query.error
    const oauthDesc = req.query.error_description
    if (oauthError) {
      return res
        .status(400)
        .type('text')
        .send(`Dropbox error: ${oauthError} — ${oauthDesc || ''}`)
    }

    const code = req.query.code
    if (!code || typeof code !== 'string') {
      return res
        .status(400)
        .type('text')
        .send('Missing authorization code. Open /api/oauth/dropbox/start first.')
    }

    try {
      const tokens = await exchangeCodeForTokens(code)
      if (!tokens.refresh_token) {
        return res.status(500).type('html').send(noRefreshTokenHtml(tokens))
      }

      const body = exchangeSuccessPlainText(tokens.refresh_token, tokens.expires_in)
      res.type('text').send(body)
    } catch (e) {
      res.status(500).type('text').send(String(e?.message || e))
    }
  })

  return router
}
