import { useCallback, useEffect, useRef, useState } from 'react'
import { openEditor } from '../adobe/editorConfig.js'
import { getInitializedSdk } from '../adobe/sdk.js'
import { uploadDesignToServer } from '../api/uploadDesign.js'
import { ADOBE_TEMPLATE_ID, BRAND_NAME, REQUIRE_ADOBE_TEMPLATE } from '../constants/config.js'
import { useRuntimeConfig } from './useRuntimeConfig.js'
import { blobFromAdobeExport, getPublishAssetPayload } from '../utils/adobeAsset.js'
import { friendlyExportFailure } from '../utils/uploadErrors.js'
import {
  clearGalleryPick,
  getGalleryCanvasSize,
  getGalleryPickId,
  getGalleryTemplateId,
  getGalleryTemplateType,
} from '../constants/gallerySelection.js'
import { buildPickupExportFilename } from '../utils/uploadFilename.js'
import {
  armUserTemplateLoadWatchdog,
  openBlankWithRandomTestAsset,
  USER_TEMPLATE_FALLBACK_MS,
} from '../utils/userTemplateFallback.js'

export function useMicrositeWorkflow() {
  const { sessionSeconds, showSessionTimer, submissionThankYouMessage } = useRuntimeConfig()
  const editorRef = useRef(null)
  const sdkRef = useRef(null)
  const launchedRef = useRef(false)
  const pickupBaseNameRef = useRef('')
  const softTimerBannerClearRef = useRef(null)
  const userTemplateFallbackRanRef = useRef(false)
  const userTemplateWatchdogActiveRef = useRef(false)
  const userTemplateWatchdogDisarmRef = useRef(null)

  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [phase, setPhase] = useState('landing')
  const [remaining, setRemaining] = useState(sessionSeconds)
  const [timerRunning, setTimerRunning] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [uploadBusy, setUploadBusy] = useState(false)
  const [banner, setBanner] = useState('')
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [showSubmissionThanks, setShowSubmissionThanks] = useState(false)

  useEffect(() => {
    setRemaining(sessionSeconds)
  }, [sessionSeconds])

  const resetForNextUser = useCallback(async () => {
    if (userTemplateWatchdogDisarmRef.current) {
      userTemplateWatchdogDisarmRef.current()
      userTemplateWatchdogDisarmRef.current = null
    }
    userTemplateWatchdogActiveRef.current = false
    userTemplateFallbackRanRef.current = false
    clearGalleryPick()
    setShowLeaveConfirm(false)
    setShowSubmissionThanks(false)
    setError('')
    setBanner('')
    setTimerRunning(false)
    pickupBaseNameRef.current = ''
    setNameInput('')
    setShowNameModal(false)
    setRemaining(sessionSeconds)

    const host = document.getElementById('express-editor')
    if (host) {
      host.innerHTML = ''
    }
    launchedRef.current = false
    setPhase('landing')

    const sdk = sdkRef.current
    if (sdk?.close) {
      Promise.resolve(sdk.close(false)).catch((e) => console.warn('Adobe close:', e))
    }
  }, [sessionSeconds])

  const openLeaveConfirm = useCallback(() => {
    if (uploadBusy) return
    setShowLeaveConfirm(true)
  }, [uploadBusy])

  const cancelLeaveConfirm = useCallback(() => {
    setShowLeaveConfirm(false)
  }, [])

  const confirmLeaveSession = useCallback(async () => {
    setShowLeaveConfirm(false)
    await resetForNextUser()
  }, [resetForNextUser])

  const dismissSubmissionThanks = useCallback(async () => {
    setShowSubmissionThanks(false)
    setBanner('')
    await resetForNextUser()
  }, [resetForNextUser])

  useEffect(
    () => () => {
      if (softTimerBannerClearRef.current) {
        clearTimeout(softTimerBannerClearRef.current)
        softTimerBannerClearRef.current = null
      }
    },
    []
  )

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        setError('')
        setStatus('loading')

        const sdk = await getInitializedSdk()
        if (cancelled) return

        if (!sdk?.editor) {
          throw new Error('Adobe SDK initialized, but editor is missing.')
        }

        sdkRef.current = sdk
        editorRef.current = sdk.editor
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        console.error('Adobe SDK init failed:', err)
        setError(err?.message || String(err))
        setStatus('error')
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (phase !== 'editing' && userTemplateWatchdogDisarmRef.current) {
      userTemplateWatchdogDisarmRef.current()
      userTemplateWatchdogDisarmRef.current = null
      userTemplateWatchdogActiveRef.current = false
    }
  }, [phase])

  useEffect(() => {
    /* Need at least 2s so we can count 2→1 then soft-reset without stuck 1s loops. */
    if (!timerRunning || phase !== 'editing' || !showSessionTimer || sessionSeconds < 2) return undefined

    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 0) return sessionSeconds
        if (r === 1) {
          queueMicrotask(() => {
            if (softTimerBannerClearRef.current) {
              clearTimeout(softTimerBannerClearRef.current)
            }
            setBanner('Session time refreshed — you can keep editing.')
            softTimerBannerClearRef.current = setTimeout(() => {
              softTimerBannerClearRef.current = null
              setBanner('')
            }, 5000)
          })
          return sessionSeconds
        }
        return r - 1
      })
    }, 1000)

    return () => clearInterval(id)
  }, [timerRunning, phase, showSessionTimer, sessionSeconds])

  const launchEditor = useCallback(() => {
    const editor = editorRef.current
    if (!editor || launchedRef.current || status !== 'ready') return

    const galleryPick = getGalleryPickId().trim()
    const galleryTemplate = getGalleryTemplateId().trim()
    const templateType = getGalleryTemplateType()
    const canvas = getGalleryCanvasSize()

    if (!galleryPick) {
      setError('Choose a template on the gallery before starting.')
      return
    }

    if (templateType === 'blankCanvas') {
      if (!canvas.width || !canvas.height) {
        setError(
          'This blank canvas tile is missing width or height. Ask an operator to set dimensions in the admin gallery.'
        )
        return
      }
    } else if (!galleryTemplate) {
      setError('Choose a template on the gallery before starting.')
      return
    }

    if (REQUIRE_ADOBE_TEMPLATE && !ADOBE_TEMPLATE_ID && !galleryTemplate && templateType !== 'blankCanvas') {
      setError('Choose a gallery image that has a template ID, or set VITE_ADOBE_TEMPLATE_ID in .env.')
      return
    }

    launchedRef.current = true
    setError('')
    setBanner('')
    setRemaining(sessionSeconds)
    setPhase('editing')
    setTimerRunning(showSessionTimer && sessionSeconds >= 2)

    const runCreate = () => {
      if (userTemplateWatchdogDisarmRef.current) {
        userTemplateWatchdogDisarmRef.current()
        userTemplateWatchdogDisarmRef.current = null
      }
      userTemplateFallbackRanRef.current = false
      userTemplateWatchdogActiveRef.current = false

      const showEditorFailure = (err) => {
        console.error('Editor error:', err)
        const detail =
          err?.message ||
          err?.error?.message ||
          err?.reason ||
          (typeof err === 'string' ? err : '')
        const short = String(detail).slice(0, 220)
        setError(
          short
            ? `${short} If this persists, refresh the page or confirm this site is in your Adobe API “allowed domains”.`
            : 'The editor hit a problem. Try refreshing the page or starting again.'
        )
      }

      async function runUserTemplateFallback(reason) {
        if (userTemplateFallbackRanRef.current) return
        userTemplateFallbackRanRef.current = true
        userTemplateWatchdogActiveRef.current = false
        if (userTemplateWatchdogDisarmRef.current) {
          userTemplateWatchdogDisarmRef.current()
          userTemplateWatchdogDisarmRef.current = null
        }
        console.warn('[userTemplate] Fallback to blank + test asset:', reason)
        setError('')
        try {
          const sdk = sdkRef.current
          if (sdk?.close) {
            await Promise.resolve(sdk.close(false)).catch((e) => console.warn('Adobe close:', e))
          }
          const host = document.getElementById('express-editor')
          if (host) host.innerHTML = ''
          await new Promise((r) => setTimeout(r, 150))
          const ed = editorRef.current
          if (!ed) throw new Error('Editor unavailable.')
          await openBlankWithRandomTestAsset(ed, appConfig)
          setBanner(
            'Your template could not be opened in time, so we started a blank design with a sample image you can replace.'
          )
        } catch (e) {
          console.error('[userTemplate] Fallback failed:', e)
          setError(
            e?.message ||
              'Could not open a fallback editor. Try again, refresh the page, or pick another template.'
          )
        }
      }

      const appConfig = {
        callbacks: {
          onCancel: async () => {
            await resetForNextUser()
          },
          onPublish: async (_intent, publishParams) => {
            /** Adobe Embed SDK v4 expects PublishStatus or it reads `.status` on undefined (TypeError). */
            const deny = () => ({ status: 'DENIED' })
            const ok = () => ({ status: 'SUCCESS' })

            const base = pickupBaseNameRef.current
            if (!base?.trim()) {
              setError('Pickup name is missing. Use Finish to enter your name, then Export & upload.')
              return deny()
            }

            const payload = getPublishAssetPayload(publishParams)
            if (!payload) {
              setError('No export yet. In Adobe Express, tap Export & upload.')
              return deny()
            }

            const filename = buildPickupExportFilename(base)

            setUploadBusy(true)
            setError('')
            try {
              const blob = await blobFromAdobeExport(payload)
              await uploadDesignToServer(blob, filename)
              setShowSubmissionThanks(true)
              return ok()
            } catch (e) {
              console.error('Publish/upload:', e, publishParams)
              setError(friendlyExportFailure(e?.message || String(e)))
              return deny()
            } finally {
              setUploadBusy(false)
            }
          },
          onError: (err) => {
            if (
              templateType === 'userTemplate' &&
              userTemplateWatchdogActiveRef.current &&
              !userTemplateFallbackRanRef.current
            ) {
              void runUserTemplateFallback('sdk-error')
              return
            }
            showEditorFailure(err)
          },
        },
      }

      try {
        const templateOverride = galleryTemplate || ADOBE_TEMPLATE_ID
        if (templateType === 'blankCanvas') {
          appConfig.selectedCategory = 'yourStuff'
        }
        if (templateType === 'userTemplate') {
          userTemplateWatchdogActiveRef.current = true
          userTemplateWatchdogDisarmRef.current = armUserTemplateLoadWatchdog({
            timeoutMs: USER_TEMPLATE_FALLBACK_MS,
            onTimeout: () => {
              void runUserTemplateFallback('timeout')
            },
            onDisarm: () => {
              userTemplateWatchdogActiveRef.current = false
            },
          })
        }
        openEditor(editor, appConfig, templateOverride, templateType, canvas)
      } catch (e) {
        if (userTemplateWatchdogDisarmRef.current) {
          userTemplateWatchdogDisarmRef.current()
          userTemplateWatchdogDisarmRef.current = null
        }
        userTemplateWatchdogActiveRef.current = false
        launchedRef.current = false
        setPhase('landing')
        setError(e?.message || String(e))
      }
    }

    runCreate()
  }, [status, resetForNextUser, sessionSeconds, showSessionTimer])

  const openStartPickupModal = useCallback(() => {
    if (status !== 'ready' || launchedRef.current) return
    const galleryPick = getGalleryPickId().trim()
    const galleryTemplate = getGalleryTemplateId().trim()
    const templateType = getGalleryTemplateType()
    const canvas = getGalleryCanvasSize()

    if (!galleryPick) {
      setError('Choose a template from the gallery before starting.')
      return
    }
    if (templateType === 'blankCanvas') {
      if (!canvas.width || !canvas.height) {
        setError('This blank canvas option needs width and height set in admin.')
        return
      }
    } else if (!galleryTemplate) {
      setError('Choose a template from the gallery before starting.')
      return
    }
    if (REQUIRE_ADOBE_TEMPLATE && !ADOBE_TEMPLATE_ID && !galleryTemplate && templateType !== 'blankCanvas') {
      setError('Choose a gallery image that has a template ID, or set VITE_ADOBE_TEMPLATE_ID in .env.')
      return
    }
    setNameInput(pickupBaseNameRef.current || '')
    setShowNameModal(true)
  }, [status])

  const confirmFileName = useCallback(async () => {
    const n = nameInput.trim()
    if (!n) {
      setError('Please enter the name you will use when you pickup the item.')
      return
    }
    pickupBaseNameRef.current = n
    setShowNameModal(false)
    setError('')
    setBanner('')
    launchEditor()
  }, [nameInput, launchEditor])

  const cancelNameModal = useCallback(() => {
    setShowNameModal(false)
  }, [])

  const galleryPick = typeof window !== 'undefined' ? getGalleryPickId().trim() : ''
  const galleryTemplate = typeof window !== 'undefined' ? getGalleryTemplateId().trim() : ''
  const galleryTemplateType = typeof window !== 'undefined' ? getGalleryTemplateType() : ''
  const galleryCanvas =
    typeof window !== 'undefined' ? getGalleryCanvasSize() : { width: 0, height: 0 }
  const blankReady =
    galleryTemplateType === 'blankCanvas' && galleryCanvas.width > 0 && galleryCanvas.height > 0
  const templateConfigured = Boolean(ADOBE_TEMPLATE_ID) || Boolean(galleryTemplate) || blankReady
  const hasLandingTemplateChoice =
    Boolean(galleryPick) && (Boolean(galleryTemplate) || blankReady)
  const canStart =
    status === 'ready' &&
    hasLandingTemplateChoice &&
    (!REQUIRE_ADOBE_TEMPLATE || templateConfigured)

  return {
    brandName: BRAND_NAME,
    phase,
    status,
    error,
    remaining,
    banner,
    showNameModal,
    nameInput,
    setNameInput,
    uploadBusy,
    openStartPickupModal,
    showLeaveConfirm,
    openLeaveConfirm,
    cancelLeaveConfirm,
    confirmLeaveSession,
    confirmFileName,
    cancelNameModal,
    canStart,
    requireAdobeTemplate: REQUIRE_ADOBE_TEMPLATE,
    templateConfigured,
    showSessionTimer,
    showSubmissionThanks,
    submissionThankYouMessage,
    dismissSubmissionThanks,
  }
}
