/** Match server `displayKey` / `normalizeTemplateId` for client-side validation. */

export function galleryDisplayKey(name) {
  const s = String(name ?? '').trim().slice(0, 240)
  return s || 'image.png'
}

export function galleryTemplateKey(v) {
  if (v == null) return ''
  const s = String(v).trim()
  if (!s) return ''
  return s.slice(0, 4096)
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
