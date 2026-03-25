/**
 * Short, user-facing copy for upload / network failures.
 */
export function friendlyUploadFailure(res, data) {
  const msg = typeof data?.error === 'string' ? data.error : ''
  if (res.status === 502) {
    return 'Could not reach the save service. Check that the app server is running.'
  }
  if (res.status === 503 && data?.code === 'DROPBOX_NOT_CONFIGURED') {
    return msg || 'Cloud save is not set up on this server yet.'
  }
  if (res.status === 401 && data?.code === 'SITE_AUTH_REQUIRED') {
    return msg || 'Session expired. Refresh the page and sign in again.'
  }
  if (res.status === 503 && data?.code === 'DROPBOX_TOKEN_EXPIRED') {
    return (
      msg ||
      'Dropbox access on the server expired. An administrator needs to reconnect Dropbox (new token or refresh-token setup).'
    )
  }
  if (res.status === 503) {
    return msg || 'Save service is temporarily unavailable. Try again in a moment.'
  }
  if (res.status === 413) {
    return 'File is too large to upload.'
  }
  if (res.status >= 500) {
    return msg || 'Something went wrong while saving. Please try again.'
  }
  return msg || `Could not save (${res.status}).`
}

export function friendlyNetworkFailure() {
  return 'No connection. Check Wi‑Fi or VPN, then try again.'
}

export function friendlyExportFailure(message) {
  const m = String(message || '')
  if (/data URL|base64|export format/i.test(m)) {
    return 'Export did not complete. In Adobe Express, use Export & upload again.'
  }
  if (/No export|No file came back/i.test(m)) {
    return m
  }
  return m || 'Export failed. Try again from Adobe Express.'
}
