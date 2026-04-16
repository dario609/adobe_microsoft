import { EXPORT_OPTIONS, EXPRESS_PARENT_ELEMENT_ID, getEditorContainerConfig } from '../adobe/editorConfig.js'

const DEFAULT_BLANK_W = Number(import.meta.env.VITE_BLANK_CANVAS_WIDTH) || 1080
const DEFAULT_BLANK_H = Number(import.meta.env.VITE_BLANK_CANVAS_HEIGHT) || 1920

/**
 * Convert image URL or data URL to base64 data URL for Adobe SDK injection
 * @param {string} imageUrl - URL or data URL
 * @returns {Promise<string>} - data:image/...;base64,... format
 */
export async function fetchImageAsDataUrl(imageUrl) {
  if (typeof imageUrl !== 'string') {
    throw new Error('Image URL must be a string')
  }

  const url = imageUrl.trim()
  if (!url) {
    throw new Error('Empty image URL')
  }

  // Already a data URL, return as-is
  if (url.startsWith('data:')) {
    return url
  }

  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching image`)
    }
    const blob = await res.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = String(reader.result || '')
        if (!dataUrl.startsWith('data:')) {
          reject(new Error('Failed to convert image to data URL'))
          return
        }
        resolve(dataUrl)
      }
      reader.onerror = () => reject(new Error('FileReader error reading blob'))
      reader.readAsDataURL(blob)
    })
  } catch (err) {
    throw new Error(`Could not load image: ${err?.message || String(err)}`)
  }
}

/**
 * Convert File or Blob to base64 data URL
 * @param {Blob|File} blob
 * @returns {Promise<string>}
 */
export async function blobToDataUrl(blob) {
  if (!blob || typeof blob.slice !== 'function') {
    throw new Error('Input must be a Blob or File')
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = String(reader.result || '')
      if (!dataUrl.startsWith('data:')) {
        reject(new Error('Failed to convert blob to data URL'))
        return
      }
      resolve(dataUrl)
    }
    reader.onerror = () => reject(new Error('FileReader error'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Open a blank canvas directly (no template selection)
 * @param {object} editor - Adobe editor instance
 * @param {object} appConfig - Editor app config
 * @param {object} options
 * @param {number} [options.width] - Canvas width in px
 * @param {number} [options.height] - Canvas height in px
 * @param {string} [options.initialAssetUrl] - Optional initial image to inject
 */
export async function openBlankCanvas(editor, appConfig, options = {}) {
  if (!editor || typeof editor.create !== 'function') {
    throw new Error('Editor is not initialized')
  }

  const width = options.width || DEFAULT_BLANK_W
  const height = options.height || DEFAULT_BLANK_H

  if (width <= 0 || height <= 0) {
    throw new Error('Canvas dimensions must be positive')
  }

  const container = getEditorContainerConfig()
  const appConfigWithDefaults = {
    ...appConfig,
    selectedCategory: 'yourStuff', // Hide template suggestions
  }

  const canvasSize = { width, height, unit: 'px' }

  // Try to inject initial asset if provided and editor supports it
  if (options.initialAssetUrl && typeof editor.createWithAsset === 'function') {
    try {
      const dataUrl = await fetchImageAsDataUrl(options.initialAssetUrl)
      editor.createWithAsset(
        {
          canvasSize,
          asset: { data: dataUrl, dataType: 'base64', type: 'image' },
        },
        appConfigWithDefaults,
        EXPORT_OPTIONS,
        container
      )
      return
    } catch (err) {
      console.warn('[blankMode] Asset injection failed, falling back to empty canvas:', err)
    }
  }

  // Fallback: open empty blank canvas
  editor.create({ canvasSize }, appConfigWithDefaults, EXPORT_OPTIONS, container)
}

/**
 * Inject an asset into an already-open editor via clipboard simulation
 * (Note: Direct layer injection not supported by SDK; this prepares data for user paste)
 * @param {string} assetDataUrl - Base64 data URL
 * @returns {object} - Prepared asset for manual injection
 */
export function prepareAssetForInjection(assetDataUrl) {
  if (!assetDataUrl || !assetDataUrl.startsWith('data:')) {
    throw new Error('Invalid data URL for asset')
  }

  return {
    dataUrl: assetDataUrl,
    mimeType: extractMimeType(assetDataUrl),
    timestamp: Date.now(),
  }
}

/**
 * Extract MIME type from data URL
 * @param {string} dataUrl
 * @returns {string}
 */
export function extractMimeType(dataUrl) {
  if (!dataUrl.startsWith('data:')) return 'image/png'
  const match = dataUrl.match(/^data:([^;]+)/)
  return match ? match[1] : 'image/png'
}

/**
 * Create a canvas element with the asset to enable drag-and-drop
 * Users can drag this onto the editor canvas
 * @param {string} assetDataUrl
 * @returns {HTMLCanvasElement}
 */
export function createDraggableAssetElement(assetDataUrl) {
  const canvas = document.createElement('canvas')
  canvas.style.display = 'none'
  canvas.style.position = 'fixed'
  canvas.style.top = '-9999px'
  canvas.style.left = '-9999px'
  canvas.dataset.dragSource = 'asset'

  const img = new Image()
  img.onload = () => {
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(img, 0, 0)
    }
  }
  img.onerror = () => {
    console.warn('[blankMode] Could not load image for drag source')
  }
  img.src = assetDataUrl

  document.body.appendChild(canvas)
  return canvas
}

/**
 * Setup drag-and-drop zone for asset injection into editor
 * @param {HTMLElement} dropZoneElement - Usually the editor container
 * @param {Function} onFilesSelected - Callback with File[] array
 * @returns {Function} - Cleanup function
 */
export function setupAssetDropZone(dropZoneElement, onFilesSelected) {
  if (!dropZoneElement) {
    throw new Error('dropZoneElement is required')
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dropZoneElement.style.opacity = '0.7'
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dropZoneElement.style.opacity = '1'
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dropZoneElement.style.opacity = '1'

    const files = Array.from(e.dataTransfer?.files || []).filter((f) =>
      f.type.startsWith('image/')
    )
    if (files.length > 0) {
      onFilesSelected?.(files)
    }
  }

  dropZoneElement.addEventListener('dragover', handleDragOver)
  dropZoneElement.addEventListener('dragleave', handleDragLeave)
  dropZoneElement.addEventListener('drop', handleDrop)

  return () => {
    dropZoneElement.removeEventListener('dragover', handleDragOver)
    dropZoneElement.removeEventListener('dragleave', handleDragLeave)
    dropZoneElement.removeEventListener('drop', handleDrop)
  }
}

/**
 * Monitor editor for ready state and inject initial asset
 * @param {string} editorContainerId - DOM element ID
 * @param {string} assetDataUrl - Data URL to inject
 * @param {number} timeoutMs - Max wait time
 * @returns {Promise<boolean>} - Resolves true if injected, false if timed out
 */
export async function injectAssetWhenEditorReady(editorContainerId, assetDataUrl, timeoutMs = 15000) {
  if (!editorContainerId || !assetDataUrl) {
    return false
  }

  return new Promise((resolve) => {
    let resolved = false
    let attempts = 0
    const maxAttempts = 30

    const checkAndInject = () => {
      if (resolved) return

      const container = document.getElementById(editorContainerId)
      if (!container) {
        attempts += 1
        if (attempts < maxAttempts) {
          setTimeout(checkAndInject, timeoutMs / maxAttempts)
        } else {
          resolved = true
          resolve(false)
        }
        return
      }

      // Try to detect if iframe is ready (rough heuristic)
      const iframe = container.querySelector('iframe')
      if (iframe) {
        // Asset is ready for user to paste/insert manually
        resolved = true
        resolve(true)
        return
      }

      attempts += 1
      if (attempts < maxAttempts) {
        setTimeout(checkAndInject, timeoutMs / maxAttempts)
      } else {
        resolved = true
        resolve(false)
      }
    }

    checkAndInject()
  })
}
