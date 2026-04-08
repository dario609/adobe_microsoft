/** Match server `displayKey` / `normalizeTemplateId` for client-side validation. */
const TEMPLATE_ID_QUERY_REGEX = /[?&]templateId=([^&]+)/i
const TEMPLATE_URN_REGEX = /urn:aaid:[^?\s"'<>]+/i

export function galleryDisplayKey(name) {
  const s = String(name ?? '').trim().slice(0, 240)
  return s || 'image.png'
}

export function normalizeGalleryTemplateId(v) {
  if (v == null) return ''
  let s = String(v).trim()
  if (!s) return ''

  const queryMatch = s.match(TEMPLATE_ID_QUERY_REGEX)
  if (queryMatch && queryMatch[1]) {
    try {
      s = decodeURIComponent(queryMatch[1])
    } catch {
      s = queryMatch[1]
    }
  }

  const urnMatch = s.match(TEMPLATE_URN_REGEX)
  if (urnMatch) {
    s = urnMatch[0]
  }

  return s.slice(0, 4096)
}

export function galleryTemplateKey(v) {
  return normalizeGalleryTemplateId(v)
}

/**
 * @returns {Record<'originalName'|'templateId', string> | null}
 */
export function validateGalleryDraftLocal(id, items, draft) {
  const display = galleryDisplayKey(draft.originalName)
  const tid = galleryTemplateKey(draft.templateId)
  /** @type {Record<string, string>} */
  const errors = {}
  if (!tid) {
    errors.templateId = 'Template ID is required.'
  }
  for (const x of items) {
    if (x.id === id) continue
    if (!errors.originalName && galleryDisplayKey(x.originalName) === display) {
      errors.originalName = 'Display name must be unique across gallery items.'
    }
    if (!errors.templateId && tid && galleryTemplateKey(x.templateId) === tid) {
      errors.templateId = 'This template ID is already used by another item.'
    }
    if (errors.originalName && errors.templateId) break
  }
  return Object.keys(errors).length ? errors : null
}
