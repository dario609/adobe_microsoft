import { useEffect, useState } from 'react'
import { apiFetch } from '../../api/apiFetch.js'

async function parseResponse(res) {
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json().catch(() => ({}))
  const text = await res.text().catch(() => '')
  return { error: text || `Request failed (${res.status}).` }
}

function toFriendlyError(res, data, fallback) {
  const raw = String(data?.error || '')
  if (isMissingSettingsRoute(raw)) {
    return 'Settings API route is missing on the deployed backend. Redeploy the latest server build (with /api/config/session and /api/config/site-password routes).'
  }
  return raw || fallback
}

function isMissingSettingsRoute(raw) {
  return (
    raw.includes('<!DOCTYPE') ||
    raw.includes('<pre>') ||
    /Cannot\s+(GET|POST|PUT|PATCH|DELETE)\s+\//i.test(raw)
  )
}

export function AdminSettingsPanel() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [passwordEnabled, setPasswordEnabled] = useState(false)
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [unsupported, setUnsupported] = useState(false)

  useEffect(() => {
    ;(async () => {
      setErr('')
      try {
        const res = await apiFetch('/api/config', { cache: 'no-store' })
        const data = await parseResponse(res)
        if (!res.ok) throw new Error(toFriendlyError(res, data, 'Could not load settings.'))
        setSessionSeconds(Number(data?.sessionSeconds) || 0)
        if (typeof data?.sitePasswordEnabled === 'boolean') {
          setPasswordEnabled(Boolean(data.sitePasswordEnabled))
          setUnsupported(false)
        } else {
          setUnsupported(true)
          setMsg('This deployment supports gallery only. Redeploy latest backend to enable timer/password settings.')
        }
      } catch (e) {
        setErr(e?.message || 'Could not load settings.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const saveTimer = async (e) => {
    e.preventDefault()
    setErr('')
    setMsg('')
    setSaving(true)
    try {
      const res = await apiFetch('/api/config/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionSeconds: Number(sessionSeconds) || 0 }),
      })
      const data = await parseResponse(res)
      if (!res.ok) {
        const message = toFriendlyError(res, data, 'Could not save timer.')
        if (isMissingSettingsRoute(String(data?.error || ''))) {
          setUnsupported(true)
          setMsg('Settings are unavailable on this backend deploy. Please redeploy server.')
          return
        }
        throw new Error(message)
      }
      setSessionSeconds(Number(data?.sessionSeconds) || 0)
      setMsg('Timer updated.')
    } catch (e) {
      setErr(e?.message || 'Could not save timer.')
    } finally {
      setSaving(false)
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    setErr('')
    setMsg('')
    setSaving(true)
    try {
      const payload = { enabled: passwordEnabled }
      if (password.trim()) payload.password = password
      const res = await apiFetch('/api/config/site-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await parseResponse(res)
      if (!res.ok) {
        const message = toFriendlyError(res, data, 'Could not save password settings.')
        if (isMissingSettingsRoute(String(data?.error || ''))) {
          setUnsupported(true)
          setMsg('Settings are unavailable on this backend deploy. Please redeploy server.')
          return
        }
        throw new Error(message)
      }
      setPasswordEnabled(Boolean(data?.sitePasswordEnabled))
      setPassword('')
      setMsg('Password settings updated.')
    } catch (e) {
      setErr(e?.message || 'Could not save password settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="adminCard adminCard--light">
      <h2 className="adminCard__title adminCard__title--small">Session settings</h2>
      <p className="adminCard__sub adminCard__sub--dark">Set timer seconds and control site password access.</p>
      {loading ? <p className="adminGallery__loading">Loading settings…</p> : null}
      {err ? <p className="appError adminGallery__error">{err}</p> : null}
      {msg ? <p className="adminSettings__ok">{msg}</p> : null}

      <div className="adminSettings__grid">
        <form className="adminSettings__card" onSubmit={saveTimer}>
          <label className="adminSettings__label" htmlFor="session-seconds">
            Timer (seconds)
          </label>
          <input
            id="session-seconds"
            className="adminSettings__input"
            type="number"
            min="0"
            step="1"
            value={sessionSeconds}
            onChange={(e) => setSessionSeconds(e.target.value)}
            disabled={saving || loading || unsupported}
          />
          <button type="submit" className="btn btn--dark btn--small" disabled={saving || loading || unsupported}>
            Save timer
          </button>
        </form>

        <form className="adminSettings__card" onSubmit={savePassword}>
          <label className="adminSettings__check">
            <input
              type="checkbox"
              checked={passwordEnabled}
              onChange={(e) => setPasswordEnabled(e.target.checked)}
              disabled={saving || loading || unsupported}
            />
            Enable password gate
          </label>
          <label className="adminSettings__label" htmlFor="site-password">
            Password {passwordEnabled ? '(required when enabled)' : '(optional)'}
          </label>
          <input
            id="site-password"
            className="adminSettings__input"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            disabled={saving || loading || unsupported}
          />
          <button type="submit" className="btn btn--dark btn--small" disabled={saving || loading || unsupported}>
            Save password settings
          </button>
        </form>
      </div>
    </section>
  )
}
