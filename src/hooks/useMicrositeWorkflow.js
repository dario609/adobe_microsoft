import { useCallback, useEffect, useRef, useState } from 'react'
import { openEditor } from '../adobe/editorConfig.js'
import { getInitializedSdk } from '../adobe/sdk.js'
import { uploadDesignToServer } from '../api/uploadDesign.js'
import {
  ADOBE_TEMPLATE_ID,
  BRAND_NAME,
  REQUIRE_ADOBE_TEMPLATE,
  SESSION_SECONDS,
} from '../constants/config.js'
import { FINISH_AFTER_NAME_BANNER } from '../constants/flow.js'
import { dataUrlToBlob } from '../utils/dataUrl.js'

export function useMicrositeWorkflow() {
  const editorRef = useRef(null)
  const sdkRef = useRef(null)
  const launchedRef = useRef(false)
  const pendingFilenameRef = useRef(null)

  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [phase, setPhase] = useState('landing')
  const [remaining, setRemaining] = useState(SESSION_SECONDS)
  const [timerRunning, setTimerRunning] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [uploadBusy, setUploadBusy] = useState(false)
  const [banner, setBanner] = useState('')

  const resetForNextUser = useCallback(async () => {
    setError('')
    setBanner('')
    setTimerRunning(false)
    pendingFilenameRef.current = null
    setNameInput('')
    setShowNameModal(false)
    setRemaining(SESSION_SECONDS)

    try {
      await sdkRef.current?.close?.(false)
    } catch (e) {
      console.warn('Adobe close:', e)
    }

    const host = document.getElementById('express-editor')
    if (host) {
      host.innerHTML = ''
    }
    launchedRef.current = false
    setPhase('landing')
  }, [])

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
    if (!timerRunning || phase !== 'editing') return undefined

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
  }, [timerRunning, phase, handleTimeUp])

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
    setRemaining(SESSION_SECONDS)
    setPhase('editing')
    setTimerRunning(true)

    const runCreate = () => {
      const appConfig = {
        callbacks: {
          onCancel: async () => {
            await resetForNextUser()
          },
          onPublish: async (_intent, publishParams) => {
            const expectedName = pendingFilenameRef.current
            if (!expectedName?.trim()) {
              setError(
                'Use Finish on this page first, enter a file name, then export from Adobe Express.'
              )
              return
            }

            const firstAsset = publishParams?.asset?.[0]
            if (!firstAsset?.data) {
              setError('No image was returned from Adobe. Try exporting again.')
              return
            }

            setUploadBusy(true)
            setError('')
            try {
              const blob = dataUrlToBlob(firstAsset.data)
              await uploadDesignToServer(blob, expectedName)
              setBanner('Uploaded to Dropbox. Resetting for the next guest…')
              await resetForNextUser()
            } catch (e) {
              console.error(e)
              setError(e?.message || String(e))
            } finally {
              setUploadBusy(false)
            }
          },
          onError: (err) => {
            console.error('Editor error:', err)
            setError(String(err))
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

    requestAnimationFrame(() => {
      requestAnimationFrame(runCreate)
    })
  }, [status, resetForNextUser])

  const openFinishModal = useCallback(() => {
    setNameInput('')
    setShowNameModal(true)
  }, [])

  const confirmFileName = useCallback(() => {
    const n = nameInput.trim()
    if (!n) {
      setError('Please enter a file name.')
      return
    }
    pendingFilenameRef.current = n
    setShowNameModal(false)
    setError('')
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
    openFinishModal,
    confirmFileName,
    cancelNameModal,
    canStart,
    requireAdobeTemplate: REQUIRE_ADOBE_TEMPLATE,
    templateConfigured,
  }
}
