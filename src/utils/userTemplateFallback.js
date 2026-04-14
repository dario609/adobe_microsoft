import { EXPORT_OPTIONS, EXPRESS_PARENT_ELEMENT_ID, getEditorContainerConfig } from '../adobe/editorConfig.js'

/** Max wait for userTemplate `editor.edit` before opening blank + placeholder (ms). */
export const USER_TEMPLATE_FALLBACK_MS = (() => {
  const n = Number(import.meta.env.VITE_USER_TEMPLATE_FALLBACK_MS)
  return Number.isFinite(n) && n >= 5000 ? n : 35000
})()

const FALLBACK_W = Number(import.meta.env.VITE_FALLBACK_CANVAS_WIDTH) || 1080
const FALLBACK_H = Number(import.meta.env.VITE_FALLBACK_CANVAS_HEIGHT) || 1920

/** Placeholder images (replace with your asset CDN later). CORS-friendly for fetch + base64. */
const PLACEHOLDER_IMAGE_URLS = [
  'https://picsum.photos/seed/adobe-fb1/1080/1920.jpg',
  'https://picsum.photos/seed/adobe-fb2/1200/1600.jpg',
  'https://picsum.photos/seed/adobe-fb3/1600/1200.jpg',
  'https://picsum.photos/seed/adobe-fb4/1080/1080.jpg',
]

export function getRandomPlaceholderImageUrl() {
  return PLACEHOLDER_IMAGE_URLS[Math.floor(Math.random() * PLACEHOLDER_IMAGE_URLS.length)]
}

async function fetchImageAsBase64(url) {
  const res = await fetch(url, { mode: 'cors' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = String(reader.result || '')
      const i = dataUrl.indexOf(',')
      resolve(i >= 0 ? dataUrl.slice(i + 1) : dataUrl)
    }
    reader.onerror = () => reject(new Error('read failed'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Opens a new blank Express project; adds a random test image via createWithAsset when possible.
 * @param {{ create: Function, createWithAsset?: Function }} editor
 * @param {object} appConfig
 */
export async function openBlankWithRandomTestAsset(editor, appConfig) {
  const container = getEditorContainerConfig()
  const ac = { ...appConfig, selectedCategory: 'yourStuff' }
  const canvasSize = { width: FALLBACK_W, height: FALLBACK_H, unit: 'px' }

  let base64 = ''
  try {
    base64 = await fetchImageAsBase64(getRandomPlaceholderImageUrl())
  } catch (e) {
    console.warn('[userTemplate fallback] Placeholder image fetch failed, using empty canvas.', e)
  }

  if (base64 && typeof editor.createWithAsset === 'function') {
    editor.createWithAsset(
      {
        canvasSize,
        asset: { data: base64, dataType: 'base64', type: 'image' },
      },
      ac,
      EXPORT_OPTIONS,
      container
    )
  } else {
    editor.create({ canvasSize }, ac, EXPORT_OPTIONS, container)
  }
}

/**
 * If an iframe mounts and stays loaded, disarm the watchdog so we don’t replace a healthy session.
 * @returns {() => void} disarm — call when starting fallback or on unmount
 */
export function armUserTemplateLoadWatchdog({ timeoutMs, onTimeout, onDisarm }) {
  let disposed = false
  let graceTimer = null

  const disarm = () => {
    if (disposed) return
    disposed = true
    clearTimeout(timer)
    clearTimeout(graceTimer)
    mo.disconnect()
    onDisarm?.()
  }

  const timer = setTimeout(() => {
    if (!disposed) onTimeout()
  }, timeoutMs)

  const host = document.getElementById(EXPRESS_PARENT_ELEMENT_ID)
  const attachIframeListeners = () => {
    if (!host || disposed) return
    for (const iframe of host.querySelectorAll('iframe')) {
      iframe.addEventListener(
        'load',
        () => {
          if (disposed) return
          clearTimeout(graceTimer)
          graceTimer = setTimeout(disarm, 4500)
        },
        { once: true }
      )
    }
  }

  const mo = new MutationObserver(() => {
    attachIframeListeners()
  })

  if (host) {
    mo.observe(host, { childList: true, subtree: true })
    attachIframeListeners()
  }

  return disarm
}
