export function dataUrlToBlob(data) {
  if (typeof data !== 'string') {
    throw new Error('Invalid asset data.')
  }
  const m = /^data:([^;]+);base64,(.+)$/s.exec(data.trim())
  if (!m) {
    throw new Error('Expected a base64 data URL from Adobe.')
  }
  const binary = atob(m[2].replace(/\s/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: m[1] || 'image/png' })
}

export function safeBaseName(name) {
  return String(name || '')
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 180)
}
