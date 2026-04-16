import { useState, useRef } from 'react'
import '../styles/BlankModeLanding.css'

/**
 * Blank mode landing - simplified UI for direct canvas start
 * Includes optional asset import via URL or file upload
 */
export function BlankModeLanding({ onStart, canStart, loading, error, status }) {
  const [showAssetImport, setShowAssetImport] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef(null)

  const startDisabled = !canStart || loading

  const handleImportUrl = () => {
    setImportError('')
    if (!importUrl.trim()) {
      setImportError('Please enter an image URL.')
      return
    }
    try {
      new URL(importUrl)
      onStart?.(importUrl)
      setShowAssetImport(false)
      setImportUrl('')
    } catch {
      setImportError('Invalid URL format.')
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setImportError('Only image files are supported.')
      return
    }

    setImportError('')
    const reader = new FileReader()
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result
      if (typeof dataUrl === 'string') {
        onStart?.(dataUrl)
        setShowAssetImport(false)
      }
    }
    reader.onerror = () => {
      setImportError('Could not read file.')
    }
    reader.readAsDataURL(file)
  }

  const startLabel = {
    loading: 'Preparing…',
    error: 'Unavailable',
    ready: 'Start Blank Canvas',
  }[status] || 'Start'

  return (
    <section className="blankModeLanding" aria-label="Blank Canvas Session">
      <div className="blankModeLanding__container">
        <div className="blankModeLanding__hero">
          <h1 className="blankModeLanding__title">Create Your Design</h1>
          <p className="blankModeLanding__subtitle">Start with a blank canvas and design freely</p>
        </div>

        {error && status === 'error' ? (
          <div className="blankModeLanding__error">
            <p>Adobe Express could not be loaded. Check that this site URL is allowed in your Adobe project.</p>
          </div>
        ) : null}

        <div className="blankModeLanding__actions">
          <button
            type="button"
            className="btn btn--primary btn--large"
            onClick={() => onStart?.()}
            disabled={startDisabled}
          >
            {startLabel}
          </button>

          {status === 'ready' && !loading && (
            <button
              type="button"
              className="btn btn--secondary btn--small"
              onClick={() => setShowAssetImport(!showAssetImport)}
            >
              {showAssetImport ? 'Hide Asset Import' : 'Import Asset'}
            </button>
          )}
        </div>

        {showAssetImport && status === 'ready' && (
          <div className="blankModeLanding__assetImport">
            <div className="assetImport__section">
              <h3 className="assetImport__label">From URL</h3>
              <div className="assetImport__inputGroup">
                <input
                  type="url"
                  className="assetImport__input"
                  placeholder="https://example.com/image.jpg"
                  value={importUrl}
                  onChange={(e) => {
                    setImportUrl(e.target.value)
                    setImportError('')
                  }}
                />
                <button
                  type="button"
                  className="btn btn--small"
                  onClick={handleImportUrl}
                >
                  Load
                </button>
              </div>
              {importError && (
                <p className="assetImport__error">{importError}</p>
              )}
            </div>

            <div className="assetImport__divider">or</div>

            <div className="assetImport__section">
              <h3 className="assetImport__label">From File</h3>
              <button
                type="button"
                className="btn btn--secondary btn--small"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        )}

        {status === 'loading' && (
          <p className="blankModeLanding__status">Connecting to Adobe Express…</p>
        )}
        {status === 'ready' && (
          <p className="blankModeLanding__status">Ready to create. Press Start or import an asset first.</p>
        )}
      </div>
    </section>
  )
}
