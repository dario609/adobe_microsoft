export const GALLERY_PICK_KEY = 'microsite_gallery_pick'

export function getGalleryPickId() {
  try {
    return sessionStorage.getItem(GALLERY_PICK_KEY) || ''
  } catch {
    return ''
  }
}

export function setGalleryPickId(id) {
  try {
    if (id) sessionStorage.setItem(GALLERY_PICK_KEY, id)
    else sessionStorage.removeItem(GALLERY_PICK_KEY)
  } catch {
    /* ignore */
  }
}

export function clearGalleryPick() {
  setGalleryPickId('')
}
