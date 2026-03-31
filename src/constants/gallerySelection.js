export const GALLERY_PICK_KEY = 'microsite_gallery_pick'
export const GALLERY_TEMPLATE_KEY = 'microsite_gallery_template'

export function getGalleryPickId() {
  try {
    return sessionStorage.getItem(GALLERY_PICK_KEY) || ''
  } catch {
    return ''
  }
}

export function getGalleryTemplateId() {
  try {
    return (sessionStorage.getItem(GALLERY_TEMPLATE_KEY) || '').trim()
  } catch {
    return ''
  }
}

export function setGalleryPickId(id, templateId = '') {
  try {
    if (id) sessionStorage.setItem(GALLERY_PICK_KEY, id)
    else sessionStorage.removeItem(GALLERY_PICK_KEY)
    const t = String(templateId ?? '').trim()
    if (t) sessionStorage.setItem(GALLERY_TEMPLATE_KEY, t)
    else sessionStorage.removeItem(GALLERY_TEMPLATE_KEY)
  } catch {
    /* ignore */
  }
}

export function clearGalleryPick() {
  setGalleryPickId('', '')
}
