/**
 * Dropbox OAuth 2.0 — authorization code + offline refresh token.
 * @see https://www.dropbox.com/developers/documentation/http/documentation#authorization
 */

import { dropboxEnv } from './envVars.js'

const AUTHORIZE_URL = 'https://www.dropbox.com/oauth2/authorize'
const TOKEN_URL = 'https://api.dropboxapi.com/oauth2/token'

export function readOAuthEnv() {
  return {
    clientId: dropboxEnv('DROPBOX_APP_KEY'),
    clientSecret: dropboxEnv('DROPBOX_APP_SECRET'),
    redirectUri: dropboxEnv('DROPBOX_REDIRECT_URI'),
  }
}

export function getAuthorizeUrl() {
  const { clientId, redirectUri } = readOAuthEnv()
  if (!clientId) {
    throw new Error('Set DROPBOX_APP_KEY in .env.')
  }
  if (!redirectUri) {
    throw new Error(
      'Set DROPBOX_REDIRECT_URI in .env (must match the Redirect URI in the Dropbox app console exactly).'
    )
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    token_access_type: 'offline',
    redirect_uri: redirectUri,
  })

  return `${AUTHORIZE_URL}?${params}`
}

export async function exchangeCodeForTokens(code) {
  const { clientId, clientSecret, redirectUri } = readOAuthEnv()
  if (!code || typeof code !== 'string') {
    throw new Error('Missing ?code= from Dropbox redirect.')
  }
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      'Token exchange requires DROPBOX_APP_KEY, DROPBOX_APP_SECRET, and DROPBOX_REDIRECT_URI.'
    )
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code.trim(),
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  })

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg =
      data.error_description ||
      (typeof data.error === 'string' ? data.error : JSON.stringify(data.error || data))
    throw new Error(msg || `Token exchange failed (${res.status})`)
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? null,
    expires_in: data.expires_in,
    token_type: data.token_type,
    account_id: data.account_id,
    uid: data.uid,
  }
}

/** Manual refresh (the Dropbox SDK also does this when using refreshToken + client credentials). */
export async function refreshWithGrant(refreshToken) {
  const { clientId, clientSecret } = readOAuthEnv()
  if (!refreshToken?.trim()) {
    throw new Error('Missing refresh token.')
  }
  if (!clientId || !clientSecret) {
    throw new Error('DROPBOX_APP_KEY and DROPBOX_APP_SECRET are required to refresh.')
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken.trim(),
    client_id: clientId,
    client_secret: clientSecret,
  })

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg =
      data.error_description ||
      (typeof data.error === 'string' ? data.error : JSON.stringify(data.error || data))
    throw new Error(msg || `Refresh failed (${res.status})`)
  }

  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
    token_type: data.token_type,
  }
}
