import { dataUrlToBlob } from './dataUrl.js'

/**
 * Reads the first export payload from Adobe Express `onPublish` callback.
 */
export function getPublishAssetPayload(publishParams) {
  const assets = publishParams?.asset
  if (!Array.isArray(assets) || assets.length === 0) {
    return null
  }
  const a = assets[0]
  if (typeof a?.data === 'string' && a.data.length > 0) return a.data
  if (typeof a?.url === 'string' && a.url.length > 0) return a.url
  return null
}

/**
 * Turn whatever Adobe returns (data URL, blob URL, https URL, or raw base64) into a Blob.
 */
export async function blobFromAdobeExport(data) {
  if (typeof data !== 'string' || !data.trim()) {
    throw new Error('Empty export from Adobe.')
  }

  const s = data.trim()

  if (s.startsWith('data:')) {
    return dataUrlToBlob(s)
  }

  if (s.startsWith('blob:') || s.startsWith('http://') || s.startsWith('https://')) {
    const res = await fetch(s)
    if (!res.ok) {
      throw new Error(`Could not download export (${res.status}).`)
    }
    return res.blob()
  }

  try {
    const binary = atob(s)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    return new Blob([bytes], { type: 'image/png' })
  } catch {
    throw new Error(
      'Unexpected export format from Adobe. Use the blue Export & upload button in the editor.'
    )
  }
}
