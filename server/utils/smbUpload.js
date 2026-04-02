import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const execFileP = promisify(execFile)

const SAFE_SHARE = /^[a-zA-Z0-9$_.-]+$/
const SAFE_PATH_PREFIX = /^[a-zA-Z0-9/_.-]*$/

/** Hostname, IPv4, or bracketed IPv6 — avoids shell/meta characters in smbclient args. */
function isSafeSmbHost(host) {
  if (!host || host.length > 253) return false
  if (/^\[[0-9a-fA-F:.]+\]$/i.test(host)) return true
  return /^[a-zA-Z0-9.-]+$/.test(host)
}

/**
 * @param {string} host
 * @param {string} share
 * @param {string} pathPrefix
 * @param {string} filename
 */
export function buildSmbDisplayPath(host, share, pathPrefix, filename) {
  const pre = (pathPrefix || '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
  return `//${host}/${share}${pre ? `/${pre}` : ''}/${filename}`
}

/**
 * @param {object} opts
 * @param {Buffer} opts.buffer
 * @param {string} opts.remoteBasename — sanitized filename only
 * @param {string} opts.host
 * @param {string} opts.share
 * @param {string} [opts.pathPrefix]
 * @param {string} [opts.domain]
 * @param {string} opts.username
 * @param {string} opts.password
 */
export async function uploadBufferViaSmb(opts) {
  const { buffer, remoteBasename, host, share, pathPrefix = '', domain, username, password } = opts

  if (!host || !isSafeSmbHost(host)) {
    throw new Error('Invalid or missing SMB server host.')
  }
  if (!share || !SAFE_SHARE.test(share)) {
    throw new Error('Invalid or missing SMB share name.')
  }
  const pre = (pathPrefix || '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
  if (pre && !SAFE_PATH_PREFIX.test(pre)) {
    throw new Error('SMB folder path contains invalid characters (use letters, numbers, /, _, -, .).')
  }
  if (!username) {
    throw new Error('SMB username is required.')
  }
  if (!password) {
    throw new Error('SMB password is required.')
  }

  const smbclient = process.env.SMB_CLIENT_PATH?.trim() || 'smbclient'
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'microsite-smb-'))
  const localFile = path.join(tmpDir, 'upload.bin')
  const authFile = path.join(tmpDir, 'auth.txt')

  const timeoutMs = Math.min(
    600_000,
    Math.max(30_000, Number(process.env.SMB_UPLOAD_TIMEOUT_MS || 120_000) || 120_000)
  )

  try {
    await fs.writeFile(localFile, buffer)

    const authLines = [`username = ${username}`, `password = ${password}`]
    if (domain) authLines.push(`domain = ${domain}`)
    await fs.writeFile(authFile, authLines.join('\n'), { mode: 0o600 })

    const remoteTarget = `//${host}/${share}`
    const cdPut = pre ? `cd ${pre}; put ${localFile} ${remoteBasename}` : `put ${localFile} ${remoteBasename}`

    try {
      await execFileP(smbclient, [remoteTarget, '-A', authFile, '-c', cdPut], {
        maxBuffer: 10 * 1024 * 1024,
        timeout: timeoutMs,
      })
    } catch (e) {
      const msg = [e?.stderr, e?.stdout, e?.message].filter(Boolean).join(' ').trim()
      if (e?.code === 'ENOENT' || /ENOENT/i.test(String(e?.message))) {
        throw new Error(
          'The smbclient program is not available on this server. Install Samba client tools (e.g. `apt install smbclient`) or set SMB_CLIENT_PATH to the binary.'
        )
      }
      throw new Error(msg || 'SMB upload failed.')
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}
