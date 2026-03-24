import { Router } from 'express'
import { uploadSingleDesign } from '../middleware/upload.js'
import { getDropboxClient } from '../dropbox/client.js'
import { buildDropboxFilePath, ensureImageExtension, safeFilename } from '../utils/filename.js'

/** Shown to guests in the app UI (non-technical). */
const DROPBOX_NOT_READY_USER =
  'Saving to Dropbox is not set up on this server yet. Ask your administrator to connect Dropbox for this deployment.'

/** For operators / logs / API clients (see /api/health). */
const DROPBOX_NOT_READY_DETAIL =
  'Set DROPBOX_ACCESS_TOKEN, or DROPBOX_REFRESH_TOKEN + DROPBOX_APP_KEY + DROPBOX_APP_SECRET. For OAuth once: GET /api/oauth/dropbox/start (redirect URI must match Dropbox app settings).'

const DROPBOX_TOKEN_EXPIRED_DETAIL =
  'The Dropbox access token expired. Prefer DROPBOX_REFRESH_TOKEN + DROPBOX_APP_KEY + DROPBOX_APP_SECRET (SDK refreshes automatically), or complete OAuth again and update .env.'

/** @param {unknown} err */
function isDropboxTokenExpired(err) {
  if (err?.name !== 'DropboxResponseError' || err.status !== 401) return false
  const blob = JSON.stringify(err.error ?? {})
  return /expired_access_token/.test(blob)
}

export function createUploadRouter() {
  const router = Router()

  router.post('/upload', uploadSingleDesign, async (req, res) => {
    try {
      const dbx = getDropboxClient()
      if (!dbx) {
        return res.status(503).json({
          error: DROPBOX_NOT_READY_USER,
          code: 'DROPBOX_NOT_CONFIGURED',
          detail: DROPBOX_NOT_READY_DETAIL,
        })
      }

      const buffer = req.file?.buffer
      if (!buffer?.length) {
        return res.status(400).json({ error: 'Missing file upload.' })
      }

      const baseName = safeFilename(req.body?.filename)
      const filename = ensureImageExtension(baseName)
      const dropboxPath = buildDropboxFilePath(filename)

      await dbx.filesUpload({
        path: dropboxPath,
        contents: buffer,
        mode: { '.tag': 'overwrite' },
      })

      res.json({ ok: true, path: dropboxPath })
    } catch (err) {
      console.error('Upload error:', err)
      if (isDropboxTokenExpired(err)) {
        return res.status(503).json({
          error:
            'Dropbox access expired on the server. Ask your administrator to reconnect Dropbox (refresh token or new OAuth).',
          code: 'DROPBOX_TOKEN_EXPIRED',
          detail: DROPBOX_TOKEN_EXPIRED_DETAIL,
        })
      }
      res.status(500).json({ error: err?.message || 'Upload failed.' })
    }
  })

  return router
}
