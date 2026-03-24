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
    sdkInitPromise = CCEverywhere.initialize(
      {
        clientId: import.meta.env.VITE_ADOBE_CLIENT_ID,
        appName: import.meta.env.VITE_ADOBE_APP_NAME,
      },
      {
        loginMode: 'delayed',
        skipBrowserSupportCheck: true,
      }
    )
  }

  return sdkInitPromise
}
