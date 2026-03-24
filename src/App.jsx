import { useEffect, useRef, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

let sdkLoadPromise = null
let sdkInitPromise = null


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


function App() {
  const editorRef = useRef(null)
  const launchedRef = useRef(false)

  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [projectId, setProjectId] = useState('')
  const [preview, setPreview] = useState('')

  const exportDesign = () => {
    if (!preview) {
      setError('No exported design is available yet.')
      return
    }

    try {
      const link = document.createElement('a')
      link.href = preview
      link.download = `adobe-design-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      setError(e?.message || 'Failed to export design.')
    }
  }

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

        editorRef.current = sdk.editor
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        console.error('Adobe SDK init failed:', err)
        setError(err?.message || String(err))
        setStatus('error')
      }
    }

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

  const startEditor = () => {
    const editor = editorRef.current
    if (!editor || launchedRef.current) return

    launchedRef.current = true
    setError('')

    const appConfig = {
      callbacks: {
        onLoad: () => {
          console.log('Adobe Express loaded')
        },
        onCancel: () => {
          console.log('User cancelled')
          launchedRef.current = false
        },
        onPublish: (_intent, publishParams) => {
          console.log('Publish params:', publishParams)
          launchedRef.current = false

          const firstAsset = publishParams?.asset?.[0]
          if (firstAsset?.data) {
            setPreview(firstAsset.data)
          }

          if (publishParams?.projectId) {
            setProjectId(publishParams.projectId)
          }
        },
        onError: (err) => {
          console.error('Editor error:', err)
          launchedRef.current = false
          setError(String(err))
        },
      },
    }

    const exportConfig = [
      {
        id: 'download',
        label: 'Download',
        action: { target: 'download' },
        style: { uiType: 'button' },
      },
      {
        id: 'save-to-host',
        label: 'Save to microsite',
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

    const templateId = import.meta.env.VITE_ADOBE_TEMPLATE_ID

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
      setError(e?.message || String(e))
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fb', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            marginBottom: 20,
          }}
        >
          <h1>Adobe Express Microsite</h1>
          <p>Simple React shell with Adobe Express inline.</p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
            <button
              onClick={startEditor}
              disabled={status !== 'ready'}
              style={{
                padding: '12px 18px',
                borderRadius: 12,
                border: 'none',
                background: status === 'ready' ? '#111827' : '#9ca3af',
                color: '#fff',
                cursor: status === 'ready' ? 'pointer' : 'not-allowed',
              }}
            >
              {status === 'loading' ? 'Loading...' : 'Start'}
            </button>

            <button
              onClick={exportDesign}
              disabled={!preview}
              style={{
                padding: '12px 18px',
                borderRadius: 12,
                border: 'none',
                background: preview ? '#2563eb' : '#9ca3af',
                color: '#fff',
                cursor: preview ? 'pointer' : 'not-allowed',
              }}
            >
              Export Design
            </button>
          </div>
          {projectId && <p>Project saved: {projectId}</p>}

          {error && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 12,
                background: '#fef2f2',
                color: '#991b1b',
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div
          id="express-editor"
          style={{
            minHeight: 720,
            background: '#fff',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          }}
        />

        {preview && (
          <div
            style={{
              marginTop: 20,
              background: '#fff',
              borderRadius: 20,
              padding: 20,
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            }}
          >
            <h2>Last exported image</h2>
            <img
              src={preview}
              alt="Export preview"
              style={{ maxWidth: '100%', borderRadius: 12 }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
