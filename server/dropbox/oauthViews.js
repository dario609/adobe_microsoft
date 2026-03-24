import { OAUTH_DROPBOX_START } from '../config.js'
import { escapeHtml } from '../utils/string.js'

export function noRefreshTokenHtml(tokens) {
  const safeJson = escapeHtml(
    JSON.stringify({ ...tokens, access_token: tokens.access_token ? '***' : undefined }, null, 2)
  )

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Dropbox — no refresh token</title></head>
<body>
<p>No <code>refresh_token</code> in the response. Usual causes:</p>
<ul>
  <li>App was already authorized for this user without <code>token_access_type=offline</code> — revoke the app at
    <a href="https://www.dropbox.com/account/connected_apps">Connected apps</a>
    and visit <a href="${OAUTH_DROPBOX_START}">${OAUTH_DROPBOX_START}</a> again.</li>
  <li>Using a Dropbox app type that does not issue refresh tokens for this flow.</li>
</ul>
<p>Raw token response (omit access_token when storing):</p>
<pre>${safeJson}</pre>
</body>
</html>`
}

export function exchangeSuccessPlainText(refreshToken, expiresIn) {
  const lines = [
    'Add or update these in your .env, then restart the API server:',
    '',
    `DROPBOX_REFRESH_TOKEN=${refreshToken}`,
    '',
    'You may remove DROPBOX_ACCESS_TOKEN if you only use refresh tokens.',
    '',
    'Optional: keep DROPBOX_APP_KEY, DROPBOX_APP_SECRET, DROPBOX_REDIRECT_URI as they are.',
    '',
    '---',
    'Short-lived access_token expires (normal). After restart, uploads use refresh_token.',
    `expires_in: ${expiresIn ?? 'n/a'}`,
  ]
  return lines.join('\n')
}
