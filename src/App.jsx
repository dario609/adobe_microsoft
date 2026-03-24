import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

let sdkLoadPromise = null
let sdkInitPromise = null

const SESSION_SECONDS = Math.max(
  60,
  parseInt(import.meta.env.VITE_SESSION_SECONDS || '900', 10) || 900
)
const BRAND_NAME = import.meta.env.VITE_BRAND_NAME || 'Create & Share'

async function loadAdobeSdk() {
  if (typeof window === 'undefined') {
    throw new Error('Adobe SDK can only load in the browser.')
  }

  if (window.CCEverywhere) {
    return window.CCEverywhere
  }

  if (!sdkLoadPromise) {
    sdkLoadPromise = import('https://cc-embed.adobe.com/sdk/v4/CCEverywhere.js')
      .then(() => {
        if (!window.CCEverywhere) {
          throw new Error('Adobe SDK loaded but window.CCEverywhere is missing.')
        }
        return window.CCEverywhere
      })
      .catch((err) => {
        sdkLoadPromise = null
        throw err
      })
  }

  return sdkLoadPromise
}

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function dataUrlToBlob(data) {
  if (typeof data !== 'string') {
    throw new Error('Invalid asset data.')
  }
  const m = /^data:([^;]+);base64,(.+)$/s.exec(data.trim())
  if (!m) {
    throw new Error('Expected a base64 data URL from Adobe.')
  }
  const binary = atob(m[2])
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: m[1] || 'image/png' })
}

function safeBaseName(name) {
  return String(name || '')
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 180)
}

function App() {
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

    async function initAdobe() {
      try {
        setError('')
        setStatus('loading')

        const CCEverywhere = await loadAdobeSdk()

        if (!sdkInitPromise) {
          sdkInitPromise = CCEverywhere.initialize(
            {
              clientId: import.meta.env.VITE_ADOBE_CLIENT_ID,
              appName: import.meta.env.VITE_ADOBE_APP_NAME,
            },
            {
              loginMode: 'delayed',
              skipBrowserSupportCheck: true,
            }
          )
        }

        const sdk = await sdkInitPromise
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

    initAdobe()

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

  const uploadToDropbox = useCallback(
    async (blob, baseName) => {
      const fd = new FormData()
      const name = safeBaseName(baseName) || `design-${Date.now()}`
      fd.append('file', blob, `${name}.png`)
      fd.append('filename', name)

      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || `Upload failed (${res.status})`)
      }
      return data
    },
    []
  )

  const startEditor = () => {
    const editor = editorRef.current
    if (!editor || launchedRef.current || status !== 'ready') return

    launchedRef.current = true
    setError('')
    setBanner('')
    pendingFilenameRef.current = null
    setRemaining(SESSION_SECONDS)
    setTimerRunning(false)
    setPhase('editing')

    const runCreate = () => {
    const appConfig = {
      callbacks: {
        onLoad: () => {
          setTimerRunning(true)
        },
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
            await uploadToDropbox(blob, expectedName)
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

    const exportConfig = [
      {
        id: 'publish-dropbox',
        label: 'Export & upload',
        action: { target: 'publish' },
        style: { uiType: 'button' },
      },
    ]

    const containerConfig = {
      mode: 'inline',
      parentElementId: 'express-editor',
      iframeTitle: 'Adobe Express Editor',
      showLoader: true,
      loadTimeout: 30000,
      hideCloseButton: true,
      padding: 0,
      borderRadius: 16,
      backgroundColor: '#ffffff',
    }

    const templateId = import.meta.env.VITE_ADOBE_TEMPLATE_ID?.trim()

    try {
      if (templateId) {
        editor.createWithTemplate(
          { templateId },
          appConfig,
          exportConfig,
          containerConfig
        )
      } else {
        editor.create(
          { canvasSize: 'BusinessCard' },
          appConfig,
          exportConfig,
          containerConfig
        )
      }
    } catch (e) {
      launchedRef.current = false
      setPhase('landing')
      setError(e?.message || String(e))
    }
    }

    setTimeout(runCreate, 0)
  }

  const openFinishModal = () => {
    setNameInput('')
    setShowNameModal(true)
  }

  const confirmFileName = () => {
    const n = nameInput.trim()
    if (!n) {
      setError('Please enter a file name.')
      return
    }
    pendingFilenameRef.current = n
    setShowNameModal(false)
    setError('')
    setBanner(
      'In Adobe Express, open Export / Share, then choose Export & upload to send your design to Dropbox.'
    )
  }

  const cancelNameModal = () => {
    setShowNameModal(false)
  }

  return (
    <div className="microsite">
      <header className="microsite__header">
        <div className="microsite__brand">
          <span className="microsite__logo" aria-hidden />
          <div>
            <h1 className="microsite__title">{BRAND_NAME}</h1>
            <p className="microsite__tagline">
              Design in Adobe Express — we&apos;ll save your work to Dropbox when you&apos;re done.
            </p>
          </div>
        </div>
      </header>

      {phase === 'landing' && (
        <section className="microsite__hero" aria-label="Welcome">
          <p className="microsite__lede">
            Tap <strong>Start</strong> to open the editor with your template, create your design, then
            finish with the steps on screen.
          </p>
          <button
            type="button"
            className="microsite__btn microsite__btn--primary"
            onClick={startEditor}
            disabled={status !== 'ready'}
          >
            {status === 'loading' ? 'Preparing…' : 'Start'}
          </button>
        </section>
      )}

      {phase === 'editing' && (
        <div className="microsite__sessionBar" role="status" aria-live="polite">
          <div className="microsite__timer">
            <span className="microsite__timerLabel">Time remaining</span>
            <span className="microsite__timerValue">{formatClock(remaining)}</span>
          </div>
          <div className="microsite__sessionActions">
            <button
              type="button"
              className="microsite__btn microsite__btn--secondary"
              onClick={openFinishModal}
              disabled={uploadBusy}
            >
              Finish
            </button>
          </div>
        </div>
      )}

      {banner && phase === 'editing' && (
        <div className="microsite__notice" role="status">
          {banner}
        </div>
      )}

      <div
        id="express-editor"
        className={
          phase === 'editing' ? 'microsite__editor microsite__editor--visible' : 'microsite__editor'
        }
        hidden={phase !== 'editing'}
      />

      {uploadBusy && (
        <div className="microsite__overlay" role="alert" aria-busy="true">
          <p>Uploading to Dropbox…</p>
        </div>
      )}

      {showNameModal && (
        <div
          className="microsite__modalRoot"
          role="dialog"
          aria-modal="true"
          aria-labelledby="filename-dialog-title"
        >
          <div className="microsite__modalBackdrop" onClick={cancelNameModal} />
          <div className="microsite__modal">
            <h2 id="filename-dialog-title" className="microsite__modalTitle">
              Name your file
            </h2>
            <p className="microsite__modalHint">
              Enter a file name only (no extension needed). You&apos;ll export from Adobe Express
              next.
            </p>
            <label className="microsite__label" htmlFor="file-name-input">
              File name
            </label>
            <input
              id="file-name-input"
              className="microsite__input"
              type="text"
              autoComplete="off"
              autoFocus
              placeholder="e.g. spring-campaign"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmFileName()
              }}
            />
            <div className="microsite__modalActions">
              <button type="button" className="microsite__btn microsite__btn--ghost" onClick={cancelNameModal}>
                Cancel
              </button>
              <button type="button" className="microsite__btn microsite__btn--primary" onClick={confirmFileName}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="microsite__error" role="alert">
          {error}
        </div>
      )}

      {status === 'error' && !error && (
        <p className="microsite__error">Adobe Express could not be loaded.</p>
      )}

    </div>
  )
}

export default App
