import { Dropbox } from 'dropbox'

/** @typedef {'refresh_token'|'access_token'|'oauth_pending'|'unconfigured'} DropboxAuthMode */

/** How Dropbox is configured (not whether the token is still valid). */
export function getDropboxAuthMode() {
  const refresh = process.env.DROPBOX_REFRESH_TOKEN?.trim()
  const key = process.env.DROPBOX_APP_KEY?.trim()
  const secret = process.env.DROPBOX_APP_SECRET?.trim()
  const access = process.env.DROPBOX_ACCESS_TOKEN?.trim()

  if (refresh && key && secret) return 'refresh_token'
  if (access) return 'access_token'
  if (key && secret && process.env.DROPBOX_REDIRECT_URI?.trim()) return 'oauth_pending'
  return 'unconfigured'
}

export function getDropboxClient() {
  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN?.trim()
  const clientId = process.env.DROPBOX_APP_KEY?.trim()
  const clientSecret = process.env.DROPBOX_APP_SECRET?.trim()
  const accessToken = process.env.DROPBOX_ACCESS_TOKEN?.trim()

  if (refreshToken && clientId && clientSecret) {
    return new Dropbox({ refreshToken, clientId, clientSecret })
  }
  if (accessToken) {
    return new Dropbox({ accessToken })
  }
  return null
}
