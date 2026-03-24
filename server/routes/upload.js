import { Router } from 'express'
import { uploadSingleDesign } from '../middleware/upload.js'
import { getDropboxClient } from '../dropbox/client.js'
import { buildDropboxFilePath, ensureImageExtension, safeFilename } from '../utils/filename.js'

const NOT_CONFIGURED =
  'Dropbox is not configured. Set DROPBOX_REFRESH_TOKEN + DROPBOX_APP_KEY + DROPBOX_APP_SECRET, or DROPBOX_ACCESS_TOKEN. For a refresh token, open GET /api/oauth/dropbox/start once (see /api/health).'

export function createUploadRouter() {
  const router = Router()

  router.post('/upload', uploadSingleDesign, async (req, res) => {
    try {
      const dbx = getDropboxClient()
      if (!dbx) {
        return res.status(503).json({ error: NOT_CONFIGURED })
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
      res.status(500).json({ error: err?.message || 'Upload failed.' })
    }
  })

  return router
}
