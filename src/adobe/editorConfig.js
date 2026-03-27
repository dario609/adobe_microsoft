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
  borderRadius: 16,
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

export function getDocumentConfig() {
  if (ADOBE_TEMPLATE_ID) {
    return { kind: 'template', templateId: ADOBE_TEMPLATE_ID }
  }
  return { kind: 'blank', canvasSize: 'BusinessCard' }
}

export function openEditor(editor, appConfig) {
  const doc = getDocumentConfig()
  const container = getEditorContainerConfig()

  if (doc.kind === 'template') {
    editor.createWithTemplate({ templateId: doc.templateId }, appConfig, EXPORT_OPTIONS, container)
  } else {
    editor.create({ canvasSize: doc.canvasSize }, appConfig, EXPORT_OPTIONS, container)
  }
}
