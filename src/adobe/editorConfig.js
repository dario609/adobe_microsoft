import { ADOBE_TEMPLATE_ID } from '../constants/config.js'
import { normalizeGalleryTemplateId, sanitizeUserTemplateLink } from '../utils/galleryDisplay.js'
import { isIOSOrIPadWebKit } from '../utils/device.js'

export const EXPRESS_PARENT_ELEMENT_ID = 'express-editor'

export const EXPORT_OPTIONS = [
  {
    id: 'publish-dropbox',
    label: 'Export & upload',
    action: { target: 'publish' },
    style: { uiType: 'button' },
  },
]

const INLINE_CONTAINER_CONFIG = {
  mode: 'inline',
  parentElementId: EXPRESS_PARENT_ELEMENT_ID,
  iframeTitle: 'Adobe Express Editor',
  showLoader: true,
  loadTimeout: 90000,
  hideCloseButton: true,
  padding: 0,
  borderRadius: 0,
  backgroundColor: '#ffffff',
}

/** WebKit on iOS often serves the mobile Express promo in a small inline iframe; `fill` uses a larger surface. */
const FILL_CONTAINER_CONFIG = {
  mode: 'fill',
  parentElementId: EXPRESS_PARENT_ELEMENT_ID,
  iframeTitle: 'Adobe Express Editor',
  showLoader: true,
  loadTimeout: 90000,
  hideCloseButton: true,
  padding: 0,
  backgroundColor: '#ffffff',
}

export function getEditorContainerConfig() {
  if (typeof window !== 'undefined' && isIOSOrIPadWebKit()) {
    return FILL_CONTAINER_CONFIG
  }
  return INLINE_CONTAINER_CONFIG
}

/** @param {string} [overrideTemplateId] — from gallery pick; falls back to env */
export function getDocumentConfig(overrideTemplateId) {
  const tid =
    normalizeGalleryTemplateId(overrideTemplateId) || normalizeGalleryTemplateId(ADOBE_TEMPLATE_ID || '')
  if (tid) {
    return { kind: 'template', templateId: tid }
  }
  return { kind: 'blank', canvasSize: 'BusinessCard' }
}

/**
 * @param {string} [overrideTemplateId]
 * @param {string} [templateType] — `adobeTemplate` | `userTemplate` | `blankCanvas`
 * @param {{ width: number, height: number }} [canvasPx] — pixel size when `templateType === 'blankCanvas'`
 */
export function openEditor(editor, appConfig, overrideTemplateId, templateType, canvasPx) {
  const container = getEditorContainerConfig()

  if (templateType === 'blankCanvas' && canvasPx && canvasPx.width > 0 && canvasPx.height > 0) {
    editor.create(
      { canvasSize: { width: canvasPx.width, height: canvasPx.height, unit: 'px' } },
      appConfig,
      EXPORT_OPTIONS,
      container
    )
    return
  }

  if (templateType === 'userTemplate') {
    const documentId = sanitizeUserTemplateLink(overrideTemplateId)
    if (documentId) {
      editor.edit({ documentId }, appConfig, EXPORT_OPTIONS, container)
      return
    }
  }

  const doc = getDocumentConfig(overrideTemplateId)

  if (doc.kind === 'template') {
    editor.createWithTemplate({ templateId: doc.templateId }, appConfig, EXPORT_OPTIONS, container)
  } else {
    editor.create({ canvasSize: doc.canvasSize }, appConfig, EXPORT_OPTIONS, container)
  }
}
