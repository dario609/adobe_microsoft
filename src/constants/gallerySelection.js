export const GALLERY_PICK_KEY = 'microsite_gallery_pick'
export const GALLERY_TEMPLATE_KEY = 'microsite_gallery_template'
export const GALLERY_TEMPLATE_TYPE_KEY = 'microsite_gallery_template_type'
export const GALLERY_FILE_EXT_KEY = 'microsite_gallery_file_ext'

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

export function getGalleryTemplateType() {
  try {
    return (sessionStorage.getItem(GALLERY_TEMPLATE_TYPE_KEY) || '').trim()
  } catch {
    return ''
  }
}

export function getGalleryPickFileExt() {
  try {
    return (sessionStorage.getItem(GALLERY_FILE_EXT_KEY) || 'png').trim() || 'png'
  } catch {
    return 'png'
  }
}

export function setGalleryPickId(id, templateId = '', templateType = '', fileExt = 'png') {
  try {
    if (id) sessionStorage.setItem(GALLERY_PICK_KEY, id)
    else sessionStorage.removeItem(GALLERY_PICK_KEY)
    const t = String(templateId ?? '').trim()
    if (t) sessionStorage.setItem(GALLERY_TEMPLATE_KEY, t)
    else sessionStorage.removeItem(GALLERY_TEMPLATE_KEY)
    const tt = String(templateType ?? '').trim()
    if (tt) sessionStorage.setItem(GALLERY_TEMPLATE_TYPE_KEY, tt)
    else sessionStorage.removeItem(GALLERY_TEMPLATE_TYPE_KEY)
    const fe = String(fileExt ?? '').trim() || 'png'
    if (id) sessionStorage.setItem(GALLERY_FILE_EXT_KEY, fe)
    else sessionStorage.removeItem(GALLERY_FILE_EXT_KEY)
  } catch {
    /* ignore */
  }
}

export function clearGalleryPick() {
  setGalleryPickId('', '', '', '')
}
