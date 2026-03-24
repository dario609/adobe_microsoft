/**
 * Best-effort: nudge the embedded Express surface toward publish so `onPublish` can fire.
 * The Embed SDK does not document a host API for export. We try safe reflection on `editor`,
 * then focus + postMessage hints (including our export option id). If nothing triggers publish,
 * the user still taps Export & upload in the editor — that path always calls `onPublish`.
 */

import { EXPORT_OPTIONS } from './editorConfig.js'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function tryInvokeEditorPublish(editor) {
  if (!editor) return false
  for (const name of ['publish', 'requestPublish']) {
    const fn = editor[name]
    if (typeof fn === 'function') {
      try {
        fn.call(editor)
        return true
      } catch {
        /* try next */
      }
    }
  }
  return false
}

export async function tryAutomatePublishExport(editor) {
  tryInvokeEditorPublish(editor)

  const iframe = document.querySelector('#express-editor iframe')
  if (!iframe?.contentWindow) {
    return
  }

  try {
    iframe.focus()
    iframe.contentWindow.focus?.()
  } catch {
    /* ignore */
  }

  const exportId = EXPORT_OPTIONS[0]?.id ?? 'publish-dropbox'
  let targetOrigin = '*'
  try {
    targetOrigin = new URL(iframe.src).origin
  } catch {
    /* keep * */
  }

  const payloads = [
    { type: 'CC_EVERYWHERE_HOST', action: 'publish', exportOptionId: exportId },
    { channel: 'CC_EVERYWHERE_AGENT', exportOptionId: exportId },
    { type: 'saveToHostApp', exportOptionId: exportId },
  ]

  for (const payload of payloads) {
    try {
      iframe.contentWindow.postMessage(payload, targetOrigin)
      iframe.contentWindow.postMessage(payload, '*')
    } catch (e) {
      console.warn('postMessage publish hint:', e)
    }
    await sleep(120)
  }
}
