import { Router } from 'express'
import { requireSiteGate } from '../middleware/requireSiteGate.js'
import { uploadSingleDesign } from '../middleware/upload.js'
import { uploadRateLimiter } from '../middleware/uploadRateLimit.js'
import { getDropboxClient } from '../dropbox/client.js'
import {
  buildDropboxFilePath,
  ensureImageExtension,
  safeFilename,
  validateUploadFilenameField,
} from '../utils/filename.js'
import { getUploadDestinationSettings } from '../utils/publicConfig.js'
import { buildSmbDisplayPath, uploadBufferViaSmb } from '../utils/smbUpload.js'
import { runUploadWithIdempotency } from '../utils/idempotencyUpload.js'
import { appendUploadHistory, listUploadHistory } from '../utils/uploadHistory.js'

/** Shown to guests in the app UI (non-technical). */
const DROPBOX_NOT_READY_USER =
  'Saving to Dropbox is not set up on this server yet. Ask your administrator to connect Dropbox for this deployment.'

/** For operators / logs / API clients (see /api/health). */
const DROPBOX_NOT_READY_DETAIL =
  'Set DROPBOX_ACCESS_TOKEN, or DROPBOX_REFRESH_TOKEN + DROPBOX_APP_KEY + DROPBOX_APP_SECRET. For OAuth once: GET /api/oauth/dropbox/start (redirect URI must match Dropbox app settings).'

const SMB_NOT_READY_USER =
  'Saving to the network share is not set up on this server yet. Ask your administrator to configure SMB in the admin panel.'

const SMB_NOT_READY_DETAIL =
  'Set upload destination to SMB and provide host, share, username, and password (admin panel or SMB_* env vars). The server needs the smbclient binary and network access to the file server.'

const SMB_UPLOAD_FAILED_USER =
  'Could not save the file to the network share. Ask your administrator to verify SMB settings and connectivity.'

const DROPBOX_TOKEN_EXPIRED_DETAIL =
  'The Dropbox access token expired. Prefer DROPBOX_REFRESH_TOKEN + DROPBOX_APP_KEY + DROPBOX_APP_SECRET (SDK refreshes automatically), or complete OAuth again and update .env.'

/** @param {unknown} err */
function isDropboxTokenExpired(err) {
  if (err?.name !== 'DropboxResponseError' || err.status !== 401) return false
  const blob = JSON.stringify(err.error ?? {})
  return /expired_access_token/.test(blob)
}

/** @param {unknown} err */
function readDropboxSummary(err) {
  try {
    if (err?.name !== 'DropboxResponseError') return ''
    const sum = err?.error?.error_summary
    return typeof sum === 'string' ? sum : ''
  } catch {
    return ''
  }
}

/**
 * @param {import('express').Request} req
 * @returns {Promise<{ statusCode: number, body: Record<string, unknown> }>}
 */
async function performUpload(req) {
  const buffer = req.file?.buffer
  if (!buffer?.length) {
    return { statusCode: 400, body: { error: 'Missing file upload.' } }
  }

  const nameCheck = validateUploadFilenameField(req.body?.filename)
  if (!nameCheck.ok) {
    return { statusCode: 400, body: { error: nameCheck.message, code: nameCheck.code } }
  }

  const baseName = safeFilename(req.body.filename)
  const filename = ensureImageExtension(baseName)
  const destination = getUploadDestinationSettings()

  const noop = process.env.LOAD_TEST_UPLOAD_NOOP === 'true'
  if (noop) {
    const delayMs = Math.min(60000, Math.max(0, Number(process.env.LOAD_TEST_UPLOAD_DELAY_MS || 0)))
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs))
    }
    const displayPath =
      destination.mode === 'smb'
        ? buildSmbDisplayPath(
            destination.smb.host || 'host',
            destination.smb.share || 'share',
            destination.smb.pathPrefix,
            filename
          )
        : buildDropboxFilePath(filename)
    await appendUploadHistory({
      fileName: filename,
      dropboxPath: displayPath,
      bytes: buffer.length,
      uploadedAt: new Date().toISOString(),
      loadTestNoop: true,
      destination: destination.mode,
    })
    return {
      statusCode: 200,
      body: { ok: true, path: displayPath, loadTestNoop: true, destination: destination.mode },
    }
  }

  if (destination.mode === 'smb') {
    const s = destination.smb
    if (!s.host || !s.share || !s.username || !s.password) {
      return {
        statusCode: 503,
        body: {
          error: SMB_NOT_READY_USER,
          code: 'SMB_NOT_CONFIGURED',
          detail: SMB_NOT_READY_DETAIL,
        },
      }
    }
    const smbPath = buildSmbDisplayPath(s.host, s.share, s.pathPrefix, filename)
    const uploadDebug = process.env.UPLOAD_DEBUG === 'true' || process.env.UPLOAD_DEBUG === '1'
    if (uploadDebug) {
      console.info('[upload debug] SMB attempt', {
        host: s.host,
        share: s.share,
        pathPrefix: s.pathPrefix || '(root)',
        domain: s.domain || '(none)',
        username: s.username,
        remoteFile: filename,
      })
    }
    try {
      await uploadBufferViaSmb({
        buffer,
        remoteBasename: filename,
        host: s.host,
        share: s.share,
        pathPrefix: s.pathPrefix,
        domain: s.domain || undefined,
        username: s.username,
        password: s.password,
      })
    } catch (err) {
      const detail = typeof err?.message === 'string' ? err.message : undefined
      console.error('SMB upload error:', err)
      if (uploadDebug) {
        console.info('[upload debug] SMB failed', { code: 'SMB_UPLOAD_FAILED', detail })
      }
      return {
        statusCode: 502,
        body: {
          error: SMB_UPLOAD_FAILED_USER,
          code: 'SMB_UPLOAD_FAILED',
          detail,
        },
      }
    }
    await appendUploadHistory({
      fileName: filename,
      dropboxPath: smbPath,
      bytes: buffer.length,
      uploadedAt: new Date().toISOString(),
      destination: 'smb',
    })
    return { statusCode: 200, body: { ok: true, path: smbPath, destination: 'smb' } }
  }

  const dropboxPath = buildDropboxFilePath(filename)

  const dbx = getDropboxClient()
  if (!dbx) {
    return {
      statusCode: 503,
      body: {
        error: DROPBOX_NOT_READY_USER,
        code: 'DROPBOX_NOT_CONFIGURED',
        detail: DROPBOX_NOT_READY_DETAIL,
      },
    }
  }

  const timeoutMs = Math.max(0, Number(process.env.DROPBOX_UPLOAD_TIMEOUT_MS || 0))
  const uploadPromise = dbx.filesUpload({
    path: dropboxPath,
    contents: buffer,
    mode: { '.tag': 'overwrite' },
  })

  try {
    if (timeoutMs > 0) {
      await Promise.race([
        uploadPromise,
        new Promise((_, reject) => {
          setTimeout(() => {
            const e = new Error('Dropbox upload timed out.')
            e.code = 'DROPBOX_UPLOAD_TIMEOUT'
            reject(e)
          }, timeoutMs)
        }),
      ])
    } else {
      await uploadPromise
    }
  } catch (err) {
    if (err?.code === 'DROPBOX_UPLOAD_TIMEOUT') {
      return {
        statusCode: 504,
        body: {
          error: 'Dropbox did not finish the upload in time. You may retry with the same Idempotency-Key to avoid duplicates if the first attempt actually succeeded.',
          code: 'DROPBOX_UPLOAD_TIMEOUT',
        },
      }
    }
    throw err
  }

  await appendUploadHistory({
    fileName: filename,
    dropboxPath,
    bytes: buffer.length,
    uploadedAt: new Date().toISOString(),
    destination: 'dropbox',
  })

  return { statusCode: 200, body: { ok: true, path: dropboxPath, destination: 'dropbox' } }
}

export function createUploadRouter() {
  const router = Router()

  router.get('/uploads', async (_req, res) => {
    const items = await listUploadHistory()
    res.json({ items })
  })

  router.post(
    '/upload',
    requireSiteGate,
    uploadRateLimiter,
    uploadSingleDesign,
    async (req, res) => {
      const rawIdem = req.headers['idempotency-key']
      const idemKey = typeof rawIdem === 'string' ? rawIdem : ''

      try {
        const result = await runUploadWithIdempotency(idemKey, () => performUpload(req))
        return res.status(result.statusCode).json(result.body)
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
        if (err?.name === 'DropboxResponseError' && err.status === 400) {
          const summary = readDropboxSummary(err)
          return res.status(500).json({
            error:
              'Dropbox rejected the upload request. This is usually caused by an invalid Dropbox path or app-folder permissions.',
            code: 'DROPBOX_BAD_REQUEST',
            detail: summary || undefined,
          })
        }
        res.status(500).json({ error: err?.message || 'Upload failed.' })
      }
    }
  )

  return router
}
