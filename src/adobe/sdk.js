let sdkLoadPromise = null
let sdkInitPromise = null

export async function loadCCEverywhere() {
  if (typeof window === 'undefined') {
    throw new Error('Adobe SDK can only load in the browser.')
  }

  if (window.CCEverywhere) {
    return window.CCEverywhere
  }

  if (!sdkLoadPromise) {
    sdkLoadPromise = import('https://cc-embed.adobe.com/sdk/v4/CCEverywhere.js')
      .then(() => {
        if (!window.CCEverywhere) {
          throw new Error('Adobe SDK loaded but window.CCEverywhere is missing.')
        }
        return window.CCEverywhere
      })
      .catch((err) => {
        sdkLoadPromise = null
        throw err
      })
  }

  return sdkLoadPromise
}

export async function getInitializedSdk() {
  const CCEverywhere = await loadCCEverywhere()

  if (!sdkInitPromise) {
    const clientId = String(import.meta.env.VITE_ADOBE_CLIENT_ID || '').trim()
    const appName = String(import.meta.env.VITE_ADOBE_APP_NAME || '').trim()
    if (!clientId || !appName) {
      throw new Error(
        'Missing Adobe embed config. Set VITE_ADOBE_CLIENT_ID and VITE_ADOBE_APP_NAME (Vercel env / .env).'
      )
    }

    // Adobe docs: full HostInfo improves compatibility (incl. Safari / iPad).
    sdkInitPromise = CCEverywhere.initialize(
      {
        clientId,
        appName,
        appVersion: { major: 1, minor: 0 },
        platformCategory: 'web',
      },
      {
        loginMode: 'delayed',
        skipBrowserSupportCheck: true,
      }
    )
  }

  return sdkInitPromise
}
