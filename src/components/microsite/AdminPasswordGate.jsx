import { useState } from 'react'
import { BRAND_NAME } from '../../constants/config.js'
import { useRuntimeConfig } from '../../hooks/useRuntimeConfig.js'

export function AdminPasswordGate() {
  const { loginAdmin } = useRuntimeConfig()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await loginAdmin(password)
    } catch (err) {
      setError(err?.message || 'Could not sign in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="siteGate">
      <div className="siteGate__card">
        <h1 className="siteGate__title">{BRAND_NAME}</h1>
        <p className="siteGate__hint">Admin panel is password protected.</p>
        <form className="siteGate__form" onSubmit={onSubmit}>
          <label className="siteGate__label" htmlFor="admin-gate-pw">
            Admin password
          </label>
          <input
            id="admin-gate-pw"
            className="siteGate__input"
            type="password"
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            enterKeyHint="go"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
          />
          {error ? (
            <p className="siteGate__error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="btn btn--primary btn--large" disabled={busy}>
            {busy ? 'Signing in…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
