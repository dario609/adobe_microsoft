import { useCallback, useEffect, useRef, useState } from 'react'
import { openEditor } from '../adobe/editorConfig.js'
import { getInitializedSdk } from '../adobe/sdk.js'
import { uploadDesignToServer } from '../api/uploadDesign.js'
import { ADOBE_TEMPLATE_ID, BRAND_NAME, REQUIRE_ADOBE_TEMPLATE } from '../constants/config.js'
import { useRuntimeConfig } from './useRuntimeConfig.js'
import { tryAutomatePublishExport } from '../adobe/tryAutomatePublishExport.js'
import { FINISH_AFTER_NAME_BANNER } from '../constants/flow.js'
import { blobFromAdobeExport, getPublishAssetPayload } from '../utils/adobeAsset.js'
import { friendlyExportFailure } from '../utils/uploadErrors.js'

export function useMicrositeWorkflow() {
  const { sessionSeconds, showSessionTimer } = useRuntimeConfig()
  const editorRef = useRef(null)
  const sdkRef = useRef(null)
  const launchedRef = useRef(false)
  const pendingFilenameRef = useRef(null)

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

  useEffect(() => {
    setRemaining(sessionSeconds)
  }, [sessionSeconds])

  const resetForNextUser = useCallback(async () => {
    setShowLeaveConfirm(false)
    setError('')
    setBanner('')
    setTimerRunning(false)
    pendingFilenameRef.current = null
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

  const handleTimeUp = useCallback(async () => {
    setBanner('')
    setError('Session time is up. The editor will close for the next guest.')
    await resetForNextUser()
  }, [resetForNextUser])

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
    if (!timerRunning || phase !== 'editing' || !showSessionTimer || sessionSeconds <= 0) return undefined

    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 0) return 0
        if (r === 1) {
          queueMicrotask(() => {
            setTimerRunning(false)
            handleTimeUp()
          })
          return 0
        }
        return r - 1
      })
    }, 1000)

    return () => clearInterval(id)
  }, [timerRunning, phase, handleTimeUp, showSessionTimer, sessionSeconds])

  const startEditor = useCallback(() => {
    const editor = editorRef.current
    if (!editor || launchedRef.current || status !== 'ready') return

    if (REQUIRE_ADOBE_TEMPLATE && !ADOBE_TEMPLATE_ID) {
      setError('Set VITE_ADOBE_TEMPLATE_ID in .env for a predefined template, then restart Vite.')
      return
    }

    launchedRef.current = true
    setError('')
    setBanner('')
    pendingFilenameRef.current = null
    setRemaining(sessionSeconds)
    setPhase('editing')
    setTimerRunning(showSessionTimer && sessionSeconds > 0)

    const runCreate = () => {
      const appConfig = {
        callbacks: {
          onCancel: async () => {
            await resetForNextUser()
          },
          onPublish: async (_intent, publishParams) => {
            const expectedName = pendingFilenameRef.current
            if (!expectedName?.trim()) {
              setError('Enter your name (Finish), then use Export & upload in Adobe.')
              return
            }

            const payload = getPublishAssetPayload(publishParams)
            if (!payload) {
              setError('No export yet. In Adobe Express, tap Export & upload.')
              return
            }

            setUploadBusy(true)
            setError('')
            try {
              const blob = await blobFromAdobeExport(payload)
              await uploadDesignToServer(blob, expectedName)
              setBanner('Uploaded to Dropbox. Resetting for the next guest…')
              await resetForNextUser()
            } catch (e) {
              console.error('Publish/upload:', e, publishParams)
              setError(friendlyExportFailure(e?.message || String(e)))
            } finally {
              setUploadBusy(false)
            }
          },
          onError: (err) => {
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
          },
        },
      }

      try {
        openEditor(editor, appConfig)
      } catch (e) {
        launchedRef.current = false
        setPhase('landing')
        setError(e?.message || String(e))
      }
    }

    // iPad Safari requires the editor create call to stay in the same user-activation
    // chain as the Start tap; double rAF can break the embed iframe.
    runCreate()
  }, [status, resetForNextUser, sessionSeconds, showSessionTimer])

  const openFinishModal = useCallback(() => {
    setNameInput('')
    setShowNameModal(true)
  }, [])

  const confirmFileName = useCallback(async () => {
    const n = nameInput.trim()
    if (!n) {
      setError('Please enter your name.')
      return
    }
    pendingFilenameRef.current = n
    setShowNameModal(false)
    setError('')
    setBanner('')

    try {
      await tryAutomatePublishExport(editorRef.current)
    } catch (e) {
      console.warn('tryAutomatePublishExport:', e)
    }

    setBanner(FINISH_AFTER_NAME_BANNER)
  }, [nameInput])

  const cancelNameModal = useCallback(() => {
    setShowNameModal(false)
  }, [])

  const templateConfigured = Boolean(ADOBE_TEMPLATE_ID)
  const canStart =
    status === 'ready' && (!REQUIRE_ADOBE_TEMPLATE || templateConfigured)

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
    startEditor,
    showLeaveConfirm,
    openLeaveConfirm,
    cancelLeaveConfirm,
    confirmLeaveSession,
    openFinishModal,
    confirmFileName,
    cancelNameModal,
    canStart,
    requireAdobeTemplate: REQUIRE_ADOBE_TEMPLATE,
    templateConfigured,
    showSessionTimer,
  }
}
