import { useEffect, useState } from 'react'
import { apiFetch } from '../../api/apiFetch.js'
import { useRuntimeConfig } from '../../hooks/useRuntimeConfig.js'
import { fileMatchesContentPolicy } from '../../utils/contentUploadPolicy.js'
import { ExperienceLogoImg } from './ExperienceLogoImg.jsx'

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

const CONTENT_IMAGE_OPTIONS = [
  { value: 'image/png', label: 'PNG' },
  { value: 'image/jpeg', label: 'JPEG' },
  { value: 'image/webp', label: 'WebP' },
  { value: 'application/pdf-standard', label: 'PDF (standard)' },
  { value: 'application/pdf-print', label: 'PDF (print)' },
]

export function AdminSettingsPanel() {
  const { reloadConfig, contentImageAccept } = useRuntimeConfig()
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
  const [contentImageMime, setContentImageMime] = useState('image/png')
  const [thankYouDraft, setThankYouDraft] = useState('')
  const [logoBusy, setLogoBusy] = useState(false)
  const [logoKey, setLogoKey] = useState(0)
  const [landBgBusy, setLandBgBusy] = useState(false)

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
        if (typeof data?.contentImageMime === 'string') setContentImageMime(data.contentImageMime)
        if (typeof data?.submissionThankYouMessage === 'string') {
          setThankYouDraft(data.submissionThankYouMessage)
        }
        try {
          const opRes = await apiFetch('/api/admin/operator-fields', { cache: 'no-store' })
          if (opRes.ok) {
            const od = await parseResponse(opRes)
            if (typeof od?.adminAccessPassword === 'string' && od.adminAccessPassword) {
              setAdminPasswordInput(od.adminAccessPassword)
            }
          }
        } catch {
          /* ignore — not signed in or older API */
        }
      } catch (e) {
        setErr(e?.message || 'Could not load settings.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const uploadExperienceLogo = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!fileMatchesContentPolicy(f, contentImageMime)) {
      setErr('Logo file must match the allowed type in Content settings below.')
      return
    }
    setErr('')
    setMsg('')
    setLogoBusy(true)
    try {
      const fd = new FormData()
      fd.append('logo', f)
      const res = await apiFetch('/api/admin/experience-logo', { method: 'POST', body: fd })
      const data = await parseResponse(res)
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Could not upload logo.')
      setMsg('Experience logo updated.')
      setLogoKey((x) => x + 1)
      await reloadConfig()
    } catch (er) {
      setErr(er?.message || 'Could not upload logo.')
    } finally {
      setLogoBusy(false)
    }
  }

  const clearExperienceLogo = async () => {
    if (!window.confirm('Remove the custom experience logo and fall back to the default asset?')) return
    setErr('')
    setMsg('')
    setLogoBusy(true)
    try {
      const res = await apiFetch('/api/admin/experience-logo', { method: 'DELETE' })
      const data = await parseResponse(res)
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Could not remove logo.')
      setMsg('Experience logo removed.')
      setLogoKey((x) => x + 1)
      await reloadConfig()
    } catch (er) {
      setErr(er?.message || 'Could not remove logo.')
    } finally {
      setLogoBusy(false)
    }
  }

  const uploadLandingBackground = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setErr('')
    setMsg('')
    setLandBgBusy(true)
    try {
      const fd = new FormData()
      fd.append('background', f)
      const res = await apiFetch('/api/admin/landing-background', { method: 'POST', body: fd })
      const data = await parseResponse(res)
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Upload failed.')
      setMsg('Landing page background updated. Refresh the user page to see it.')
    } catch (er) {
      setErr(er?.message || 'Could not upload background.')
    } finally {
      setLandBgBusy(false)
    }
  }

  const clearLandingBackground = async () => {
    if (!window.confirm('Remove the landing page background?')) return
    setErr('')
    setMsg('')
    setLandBgBusy(true)
    try {
      const res = await apiFetch('/api/admin/landing-background', { method: 'DELETE' })
      const data = await parseResponse(res)
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Remove failed.')
      setMsg('Landing background removed.')
    } catch (er) {
      setErr(er?.message || 'Could not remove background.')
    } finally {
      setLandBgBusy(false)
    }
  }

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
      setMsg('Admin password settings updated.')
      await reloadConfig()
    } catch (e) {
      setErr(e?.message || 'Could not save admin password.')
    } finally {
      setSaving(false)
    }
  }

  const saveContentSettings = async (e) => {
    e.preventDefault()
    setErr('')
    setMsg('')
    setSaving(true)
    try {
      const res = await apiFetch('/api/config/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentImageMime,
          submissionThankYouMessage: thankYouDraft,
        }),
      })
      const data = await parseResponse(res)
      if (!res.ok) {
        throw new Error(toFriendlyError(res, data, 'Could not save content settings.'))
      }
      if (typeof data?.contentImageMime === 'string') setContentImageMime(data.contentImageMime)
      if (typeof data?.submissionThankYouMessage === 'string') {
        setThankYouDraft(data.submissionThankYouMessage)
      }
      setMsg('Gallery format and thank-you message updated.')
      await reloadConfig()
    } catch (err) {
      setErr(err?.message || 'Could not save content settings.')
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
      <p className="adminCard__sub adminCard__sub--dark">
        Branding, content rules, landing background, timer, admin panel password, and visitor site password.
      </p>
      {loading ? <p className="adminGallery__loading">Loading settings…</p> : null}
      {err ? <p className="appError adminGallery__error">{err}</p> : null}
      {msg ? <p className="adminSettings__ok">{msg}</p> : null}

      <div className="adminSettings__stack">
        <div className="adminSettings__card">
          <div className="adminSettings__cardHead">
            <span className="adminSettings__badge adminSettings__badge--site">Brand</span>
            <p className="adminSettings__cardTitle">Experience logo</p>
          </div>
          <p className="adminSettings__hint">
            Shown on the template picker and beside the guest&apos;s design in Express. Must match the allowed file type
            in Content settings (including PDF when selected).
          </p>
          <div className="adminSettings__logoRow">
            <ExperienceLogoImg key={logoKey} className="landHeader__logo" width={56} height={56} />
          </div>
          <div className="adminSettings__btnRow">
            <label className="btn btn--adminPrimary btn--small">
              {logoBusy ? 'Working…' : 'Upload logo'}
              <input
                type="file"
                className="adminGallery__fileInput"
                accept={contentImageAccept}
                disabled={logoBusy || loading}
                onChange={uploadExperienceLogo}
              />
            </label>
            <button
              type="button"
              className="btn btn--adminSoft btn--small"
              disabled={logoBusy || loading}
              onClick={clearExperienceLogo}
            >
              Remove logo
            </button>
          </div>
        </div>

        <form className="adminSettings__card" onSubmit={saveContentSettings}>
          <div className="adminSettings__cardHead">
            <span className="adminSettings__badge adminSettings__badge--site">Content</span>
            <p className="adminSettings__cardTitle">Gallery &amp; banner uploads</p>
          </div>
          <p className="adminSettings__hint">
            Gallery, session banner, and experience logo uploads must match this type. The server rejects anything else.
          </p>
          <label className="adminSettings__label" htmlFor="content-image-mime">
            Allowed file format
          </label>
          <select
            id="content-image-mime"
            className="adminSettings__input"
            value={contentImageMime}
            onChange={(e) => setContentImageMime(e.target.value)}
            disabled={saving || loading || unsupported}
          >
            {CONTENT_IMAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <label className="adminSettings__label" htmlFor="thank-you-message">
            Message after successful submission
          </label>
          <textarea
            id="thank-you-message"
            className="adminSettings__input"
            rows={4}
            value={thankYouDraft}
            onChange={(e) => setThankYouDraft(e.target.value)}
            disabled={saving || loading || unsupported}
            placeholder="Thank you for your submission…"
          />
          <button type="submit" className="btn btn--adminPrimary btn--small" disabled={saving || loading || unsupported}>
            Save content settings
          </button>
        </form>

        <div className="adminSettings__card">
          <div className="adminSettings__cardHead">
            <span className="adminSettings__badge adminSettings__badge--site">Landing</span>
            <p className="adminSettings__cardTitle">User page background</p>
          </div>
          <p className="adminSettings__hint">
            Full-page backdrop behind the template picker (PNG, JPEG, or WebP only). Leave empty for the default
            gradient.
          </p>
          <div className="adminSettings__btnRow">
            <label className="btn btn--adminPrimary btn--small">
              {landBgBusy ? 'Working…' : 'Upload background'}
              <input
                type="file"
                className="adminGallery__fileInput"
                accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                disabled={landBgBusy || loading}
                onChange={uploadLandingBackground}
              />
            </label>
            <button
              type="button"
              className="btn btn--adminSoft btn--small"
              disabled={landBgBusy || loading}
              onClick={clearLandingBackground}
            >
              Remove background
            </button>
          </div>
        </div>

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
          <button type="submit" className="btn btn--adminPrimary btn--small" disabled={saving || loading || unsupported}>
            Save timer
          </button>
        </form>

        <form className="adminSettings__card adminSettings__card--admin" onSubmit={saveAdminPassword}>
          <div className="adminSettings__cardHead">
            <span className="adminSettings__badge adminSettings__badge--admin">Admin</span>
            <p className="adminSettings__cardTitle">Admin panel password</p>
          </div>
          <p className="adminSettings__hint">
            Protects <code className="adminSettings__code">/admin</code>. Shown below when saved (same machine /
            trusted operators only).
          </p>
          <label className="adminSettings__check">
            <input
              type="checkbox"
              checked={adminPasswordEnabled}
              onChange={(e) => setAdminPasswordEnabled(e.target.checked)}
              disabled={saving || loading || unsupported}
            />
            Require password to open admin panel
          </label>
          <label className="adminSettings__label" htmlFor="admin-password">
            Admin password {adminPasswordEnabled ? '(required when enabled)' : '(optional)'}
          </label>
          <input
            id="admin-password"
            className="adminSettings__input adminSettings__input--pw"
            type="text"
            autoComplete="off"
            spellCheck="false"
            value={adminPasswordInput}
            onChange={(e) => setAdminPasswordInput(e.target.value)}
            placeholder={adminPlaceholder}
            disabled={saving || loading || unsupported}
          />
          <div className="adminSettings__btnRow">
            <button type="submit" className="btn btn--adminPrimary btn--small" disabled={saving || loading || unsupported}>
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

        <form className="adminSettings__card adminSettings__card--site" onSubmit={saveSitePassword}>
          <div className="adminSettings__cardHead">
            <span className="adminSettings__badge adminSettings__badge--site">Site</span>
            <p className="adminSettings__cardTitle">Visitor site password</p>
          </div>
          <p className="adminSettings__hint">Main kiosk / template picker — not the admin panel.</p>
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
            className="adminSettings__input adminSettings__input--pw"
            type="text"
            autoComplete="off"
            spellCheck="false"
            value={sitePasswordInput}
            onChange={(e) => setSitePasswordInput(e.target.value)}
            placeholder={sitePlaceholder}
            disabled={saving || loading || unsupported}
          />
          <div className="adminSettings__btnRow">
            <button type="submit" className="btn btn--adminPrimary btn--small" disabled={saving || loading || unsupported}>
              Save visitor password
            </button>
            <button
              type="button"
              className="btn btn--adminSoft btn--small"
              disabled={saving || loading || unsupported || !sitePasswordSet}
              onClick={clearSitePassword}
            >
              Clear visitor password
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
