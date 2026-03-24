import { ADOBE_TEMPLATE_ID } from '../constants/config.js'

export const EXPRESS_PARENT_ELEMENT_ID = 'express-editor'

export const EXPORT_OPTIONS = [
  {
    id: 'publish-dropbox',
    label: 'Export & upload',
    action: { target: 'publish' },
    style: { uiType: 'button' },
  },
]

export const CONTAINER_CONFIG = {
  mode: 'inline',
  parentElementId: EXPRESS_PARENT_ELEMENT_ID,
  iframeTitle: 'Adobe Express Editor',
  showLoader: true,
  loadTimeout: 30000,
  hideCloseButton: true,
  padding: 0,
  borderRadius: 16,
  backgroundColor: '#ffffff',
}

export function getDocumentConfig() {
  if (ADOBE_TEMPLATE_ID) {
    return { kind: 'template', templateId: ADOBE_TEMPLATE_ID }
  }
  return { kind: 'blank', canvasSize: 'BusinessCard' }
}

export function openEditor(editor, appConfig) {
  const doc = getDocumentConfig()

  if (doc.kind === 'template') {
    editor.createWithTemplate(
      { templateId: doc.templateId },
      appConfig,
      EXPORT_OPTIONS,
      CONTAINER_CONFIG
    )
  } else {
    editor.create({ canvasSize: doc.canvasSize }, appConfig, EXPORT_OPTIONS, CONTAINER_CONFIG)
  }
}
