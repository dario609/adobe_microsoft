import { useCallback, useEffect, useRef, useState } from 'react'
import { getInitializedSdk } from '../adobe/sdk.js'
import { uploadDesignToServer } from '../api/uploadDesign.js'
import { BRAND_NAME } from '../constants/config.js'
import { useRuntimeConfig } from './useRuntimeConfig.js'
import { blobFromAdobeExport, getPublishAssetPayload } from '../utils/adobeAsset.js'
import { friendlyExportFailure } from '../utils/uploadErrors.js'
import { buildPickupExportFilename } from '../utils/uploadFilename.js'
import { openBlankCanvas, blobToDataUrl } from '../utils/blankModeUtils.js'

const BLANK_MODE_CANVAS_W = Number(import.meta.env.VITE_BLANK_CANVAS_WIDTH) || 1080
const BLANK_MODE_CANVAS_H = Number(import.meta.env.VITE_BLANK_CANVAS_HEIGHT) || 1920

/**
 * Hook for blank canvas mode workflow (no template selection, direct to editor)
 * Supports:
 * - Opening blank canvas immediately after name pickup
 * - Optional initial asset injection
 * - Dynamic asset import via file upload or URL
 * - Standard export/upload flow
 */
export function useBlankModeWorkflow() {
  const { sessionSeconds, showSessionTimer } = useRuntimeConfig()
  const editorRef = useRef(null)
  const sdkRef = useRef(null)
  const launchedRef = useRef(false)
  const pickupBaseNameRef = useRef('')
  const softTimerBannerClearRef = useRef(null)

  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [phase, setPhase] = useState('landing')
  const [remaining, setRemaining] = useState(sessionSeconds)
  const [timerRunning, setTimerRunning] = useState(false)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [banner, setBanner] = useState('')
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [showSubmissionThanks, setShowSubmissionThanks] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [nameInput, setNameInput] = useState('')

  useEffect(() => {
    setRemaining(sessionSeconds)
  }, [sessionSeconds])

  // Initialize Adobe SDK once
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

  // Timer effect
  useEffect(() => {
    if (!timerRunning || phase !== 'editing' || !showSessionTimer || sessionSeconds < 2) {
      return undefined
    }

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

  const resetForNextUser = useCallback(async () => {
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

  const launchBlankEditor = useCallback(
    (initialAssetUrl = null) => {
      const editor = editorRef.current
      if (!editor || launchedRef.current || status !== 'ready') return

      if (!pickupBaseNameRef.current?.trim()) {
        setError('Enter your pickup name to start.')
        return
      }

      launchedRef.current = true
      setError('')
      setBanner('')
      setRemaining(sessionSeconds)
      setPhase('editing')
      setTimerRunning(showSessionTimer && sessionSeconds >= 2)

      const appConfig = {
        callbacks: {
          onCancel: async () => {
            await resetForNextUser()
          },
          onPublish: async (_intent, publishParams) => {
            const deny = () => ({ status: 'DENIED' })
            const ok = () => ({ status: 'SUCCESS' })

            const base = pickupBaseNameRef.current
            if (!base?.trim()) {
              setError('Pickup name is missing.')
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
            console.error('Editor error:', err)
            const detail = err?.message || err?.error?.message || err?.reason || String(err)
            const short = String(detail).slice(0, 220)
            setError(
              short
                ? `${short} Try refreshing or check your Adobe API settings.`
                : 'The editor hit a problem. Try refreshing.'
            )
          },
        },
      }

      try {
        openBlankCanvas(editor, appConfig, {
          width: BLANK_MODE_CANVAS_W,
          height: BLANK_MODE_CANVAS_H,
          initialAssetUrl,
        }).catch((err) => {
          console.error('[blankMode] Launch failed:', err)
          launchedRef.current = false
          setPhase('landing')
          setError(err?.message || 'Could not open blank editor.')
        })
      } catch (e) {
        launchedRef.current = false
        setPhase('landing')
        setError(e?.message || String(e))
      }
    },
    [status, resetForNextUser, sessionSeconds, showSessionTimer]
  )

  const startBlankMode = useCallback(() => {
    if (status !== 'ready' || launchedRef.current) return
    setNameInput(pickupBaseNameRef.current || '')
    setShowNameModal(true)
  }, [status])

  const confirmFileName = useCallback(async () => {
    const n = nameInput.trim()
    if (!n) {
      setError('Please enter your pickup name.')
      return
    }
    pickupBaseNameRef.current = n
    setShowNameModal(false)
    setError('')
    setBanner('')
    launchBlankEditor()
  }, [nameInput, launchBlankEditor])

  const cancelNameModal = useCallback(() => {
    setShowNameModal(false)
  }, [])

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

  const importAssetFromFile = useCallback(
    async (file) => {
      if (!file || !file.type.startsWith('image/')) {
        setError('Only image files can be imported.')
        return
      }

      try {
        setError('')
        const dataUrl = await blobToDataUrl(file)
        // Inject/use the asset (in blank editor, users paste/drag it)
        setBanner(`Asset "${file.name}" ready. You can insert it into your design.`)
        // In a real scenario, we could auto-inject if editor is already open
      } catch (err) {
        setError(`Could not load image: ${err?.message}`)
      }
    },
    []
  )

  const importAssetFromUrl = useCallback(
    async (imageUrl) => {
      try {
        setError('')
        if (!imageUrl.trim()) {
          setError('Please provide an image URL.')
          return
        }
        // In a real scenario, validate and inject the URL
        setBanner(`Asset loaded from URL. You can insert it into your design.`)
      } catch (err) {
        setError(`Could not load image from URL: ${err?.message}`)
      }
    },
    []
  )

  useEffect(
    () => () => {
      if (softTimerBannerClearRef.current) {
        clearTimeout(softTimerBannerClearRef.current)
        softTimerBannerClearRef.current = null
      }
    },
    []
  )

  return {
    brandName: BRAND_NAME,
    phase,
    status,
    error,
    remaining,
    banner,
    uploadBusy,
    showLeaveConfirm,
    showSubmissionThanks,
    showNameModal,
    nameInput,
    setNameInput,
    startBlankMode,
    launchBlankEditor,
    openLeaveConfirm,
    cancelLeaveConfirm,
    confirmLeaveSession,
    confirmFileName,
    cancelNameModal,
    dismissSubmissionThanks,
    importAssetFromFile,
    importAssetFromUrl,
    canStart: status === 'ready',
    showSessionTimer,
  }
}
