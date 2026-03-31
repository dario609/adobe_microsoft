import { useEffect, useState } from 'react'
import { apiFetch } from '../../api/apiFetch.js'
import { useRuntimeConfig } from '../../hooks/useRuntimeConfig.js'

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
  const { reloadConfig } = useRuntimeConfig()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [passwordEnabled, setPasswordEnabled] = useState(false)
  const [sitePasswordSet, setSitePasswordSet] = useState(false)
  const [sitePasswordInput, setSitePasswordInput] = useState('')
  const [adminPasswordEnabled, setAdminPasswordEnabled] = useState(false)
  const [adminPasswordSet, setAdminPasswordSet] = useState(false)
  const [adminPasswordInput, setAdminPasswordInput] = useState('')
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
        setSitePasswordSet(Boolean(data?.sitePasswordSet))
        setAdminPasswordEnabled(Boolean(data?.adminPasswordEnabled))
        setAdminPasswordSet(Boolean(data?.adminPasswordSet))
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

  const saveSitePassword = async (e) => {
    e.preventDefault()
    setErr('')
    setMsg('')
    setSaving(true)
    try {
      const payload = { enabled: passwordEnabled }
      if (sitePasswordInput.trim()) payload.password = sitePasswordInput.trim()
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
      setSitePasswordSet(Boolean(data?.sitePasswordSet))
      setSitePasswordInput('')
      setMsg('User site password settings updated.')
      await reloadConfig()
    } catch (e) {
      setErr(e?.message || 'Could not save password settings.')
    } finally {
      setSaving(false)
    }
  }

  const clearSitePassword = async () => {
    if (!window.confirm('Remove the user site password and disable the gate?')) return
    setErr('')
    setMsg('')
    setSaving(true)
    try {
      const res = await apiFetch('/api/config/site-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearPassword: true }),
      })
      const data = await parseResponse(res)
      if (!res.ok) throw new Error(toFriendlyError(res, data, 'Could not clear password.'))
      setPasswordEnabled(Boolean(data?.sitePasswordEnabled))
      setSitePasswordSet(Boolean(data?.sitePasswordSet))
      setSitePasswordInput('')
      setMsg('User site password cleared.')
      await reloadConfig()
    } catch (e) {
      setErr(e?.message || 'Could not clear password.')
    } finally {
      setSaving(false)
    }
  }

  const saveAdminPassword = async (e) => {
    e.preventDefault()
    setErr('')
    setMsg('')
    setSaving(true)
    try {
      const payload = { enabled: adminPasswordEnabled }
      if (adminPasswordInput.trim()) payload.password = adminPasswordInput.trim()
      const res = await apiFetch('/api/config/admin-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await parseResponse(res)
      if (!res.ok) {
        const message = toFriendlyError(res, data, 'Could not save admin password.')
        if (isMissingSettingsRoute(String(data?.error || ''))) {
          setUnsupported(true)
          setMsg('Settings are unavailable on this backend deploy. Please redeploy server.')
          return
        }
        throw new Error(message)
      }
      setAdminPasswordEnabled(Boolean(data?.adminPasswordEnabled))
      setAdminPasswordSet(Boolean(data?.adminPasswordSet))
      setAdminPasswordInput('')
      setMsg('Admin password settings updated.')
      await reloadConfig()
    } catch (e) {
      setErr(e?.message || 'Could not save admin password.')
    } finally {
      setSaving(false)
    }
  }

  const clearAdminPassword = async () => {
    if (!window.confirm('Remove the admin password and disable admin access protection?')) return
    setErr('')
    setMsg('')
    setSaving(true)
    try {
      const res = await apiFetch('/api/config/admin-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearPassword: true }),
      })
      const data = await parseResponse(res)
      if (!res.ok) throw new Error(toFriendlyError(res, data, 'Could not clear admin password.'))
      setAdminPasswordEnabled(Boolean(data?.adminPasswordEnabled))
      setAdminPasswordSet(Boolean(data?.adminPasswordSet))
      setAdminPasswordInput('')
      setMsg('Admin password cleared.')
      await reloadConfig()
    } catch (e) {
      setErr(e?.message || 'Could not clear admin password.')
    } finally {
      setSaving(false)
    }
  }

  const sitePlaceholder = sitePasswordSet
    ? 'Password saved — enter new to change'
    : 'Enter user site password'
  const adminPlaceholder = adminPasswordSet
    ? 'Password saved — enter new to change'
    : 'Enter admin password'

  return (
    <section className="adminCard adminCard--light adminSettings">
      <h2 className="adminCard__title adminCard__title--small">Session settings</h2>
      <p className="adminCard__sub adminCard__sub--dark">Timer, user site gate, and admin panel access.</p>
      {loading ? <p className="adminGallery__loading">Loading settings…</p> : null}
      {err ? <p className="appError adminGallery__error">{err}</p> : null}
      {msg ? <p className="adminSettings__ok">{msg}</p> : null}

      <div className="adminSettings__stack">
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
          <button type="submit" className="btn btn--adminGradient btn--small" disabled={saving || loading || unsupported}>
            Save timer
          </button>
        </form>

        <form className="adminSettings__card" onSubmit={saveSitePassword}>
          <p className="adminSettings__cardTitle">User site password</p>
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
            type="password"
            autoComplete="new-password"
            value={sitePasswordInput}
            onChange={(e) => setSitePasswordInput(e.target.value)}
            placeholder={sitePlaceholder}
            disabled={saving || loading || unsupported}
          />
          <div className="adminSettings__btnRow">
            <button type="submit" className="btn btn--adminGradient btn--small" disabled={saving || loading || unsupported}>
              Save user password
            </button>
            <button
              type="button"
              className="btn btn--adminSoft btn--small"
              disabled={saving || loading || unsupported || !sitePasswordSet}
              onClick={clearSitePassword}
            >
              Clear user password
            </button>
          </div>
        </form>

        <form className="adminSettings__card" onSubmit={saveAdminPassword}>
          <p className="adminSettings__cardTitle">Admin panel password</p>
          <p className="adminSettings__hint">
            When set, the <code className="adminSettings__code">/admin</code> page requires this password before showing
            templates and settings.
          </p>
          <label className="adminSettings__check">
            <input
              type="checkbox"
              checked={adminPasswordEnabled}
              onChange={(e) => setAdminPasswordEnabled(e.target.checked)}
              disabled={saving || loading || unsupported}
            />
            Require admin password
          </label>
          <label className="adminSettings__label" htmlFor="admin-password">
            Admin password {adminPasswordEnabled ? '(required when enabled)' : '(optional)'}
          </label>
          <input
            id="admin-password"
            className="adminSettings__input"
            type="password"
            autoComplete="new-password"
            value={adminPasswordInput}
            onChange={(e) => setAdminPasswordInput(e.target.value)}
            placeholder={adminPlaceholder}
            disabled={saving || loading || unsupported}
          />
          <div className="adminSettings__btnRow">
            <button type="submit" className="btn btn--adminGradient btn--small" disabled={saving || loading || unsupported}>
              Save admin password
            </button>
            <button
              type="button"
              className="btn btn--adminSoft btn--small"
              disabled={saving || loading || unsupported || !adminPasswordSet}
              onClick={clearAdminPassword}
            >
              Clear admin password
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
