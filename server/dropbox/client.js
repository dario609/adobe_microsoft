import { Dropbox } from 'dropbox'
import { dropboxEnv } from './envVars.js'

/** @typedef {'refresh_token'|'access_token'|'oauth_pending'|'unconfigured'} DropboxAuthMode */

const t = dropboxEnv

/** How Dropbox is configured (not whether the token is still valid). */
export function getDropboxAuthMode() {
  const refresh = t('DROPBOX_REFRESH_TOKEN')
  const key = t('DROPBOX_APP_KEY')
  const secret = t('DROPBOX_APP_SECRET')
  const access = t('DROPBOX_ACCESS_TOKEN')

  if (refresh && key && secret) return 'refresh_token'
  if (access) return 'access_token'
  if (key && secret && t('DROPBOX_REDIRECT_URI')) return 'oauth_pending'
  return 'unconfigured'
}

export function getDropboxClient() {
  const refreshToken = t('DROPBOX_REFRESH_TOKEN')
  const clientId = t('DROPBOX_APP_KEY')
  const clientSecret = t('DROPBOX_APP_SECRET')
  const accessToken = t('DROPBOX_ACCESS_TOKEN')

  if (refreshToken && clientId && clientSecret) {
    return new Dropbox({ refreshToken, clientId, clientSecret })
  }
  if (accessToken) {
    return new Dropbox({ accessToken })
  }
  return null
}
