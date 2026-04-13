export const GALLERY_PICK_KEY = 'microsite_gallery_pick'
export const GALLERY_TEMPLATE_KEY = 'microsite_gallery_template'
export const GALLERY_TEMPLATE_TYPE_KEY = 'microsite_gallery_template_type'
export const GALLERY_FILE_EXT_KEY = 'microsite_gallery_file_ext'
export const GALLERY_CANVAS_W_KEY = 'microsite_gallery_canvas_w'
export const GALLERY_CANVAS_H_KEY = 'microsite_gallery_canvas_h'

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

/** Pixel size for `blankCanvas` gallery entries (from sessionStorage). */
export function getGalleryCanvasSize() {
  try {
    const w = parseInt(sessionStorage.getItem(GALLERY_CANVAS_W_KEY) || '0', 10)
    const h = parseInt(sessionStorage.getItem(GALLERY_CANVAS_H_KEY) || '0', 10)
    return {
      width: Number.isFinite(w) && w > 0 ? w : 0,
      height: Number.isFinite(h) && h > 0 ? h : 0,
    }
  } catch {
    return { width: 0, height: 0 }
  }
}

export function setGalleryPickId(
  id,
  templateId = '',
  templateType = '',
  fileExt = 'png',
  canvasW = 0,
  canvasH = 0
) {
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
    if (id) {
      sessionStorage.setItem(GALLERY_FILE_EXT_KEY, fe)
      sessionStorage.setItem(GALLERY_CANVAS_W_KEY, String(Math.max(0, Math.floor(Number(canvasW) || 0))))
      sessionStorage.setItem(GALLERY_CANVAS_H_KEY, String(Math.max(0, Math.floor(Number(canvasH) || 0))))
    } else {
      sessionStorage.removeItem(GALLERY_FILE_EXT_KEY)
      sessionStorage.removeItem(GALLERY_CANVAS_W_KEY)
      sessionStorage.removeItem(GALLERY_CANVAS_H_KEY)
    }
  } catch {
    /* ignore */
  }
}

export function clearGalleryPick() {
  setGalleryPickId('', '', '', '', 0, 0)
}
