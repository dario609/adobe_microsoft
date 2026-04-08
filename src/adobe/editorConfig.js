import { ADOBE_TEMPLATE_ID } from '../constants/config.js'
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
  const tid = String(overrideTemplateId ?? '').trim() || String(ADOBE_TEMPLATE_ID || '').trim()
  if (tid) {
    return { kind: 'template', templateId: tid }
  }
  return { kind: 'blank', canvasSize: 'BusinessCard' }
}

/** @param {string} [overrideTemplateId] @param {string} [templateType] */
export function openEditor(editor, appConfig, overrideTemplateId, templateType) {
  const doc = getDocumentConfig(overrideTemplateId)
  const container = getEditorContainerConfig()

  if (doc.kind === 'template') {
    if (templateType === 'userTemplate') {
      // For user templates, use edit() method
      editor.edit({ documentId: doc.templateId }, appConfig, EXPORT_OPTIONS, container)
    } else {
      // For Adobe templates, use createWithTemplate() method
      editor.createWithTemplate({ templateId: doc.templateId }, appConfig, EXPORT_OPTIONS, container)
    }
  } else {
    editor.create({ canvasSize: doc.canvasSize }, appConfig, EXPORT_OPTIONS, container)
  }
}
