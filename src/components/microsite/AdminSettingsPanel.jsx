import { useEffect, useState } from 'react'
import { apiFetch } from '../../api/apiFetch.js'
import { useRuntimeConfig } from '../../hooks/useRuntimeConfig.js'
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
  const [thankYouDraft, setThankYouDraft] = useState('')
  const [logoBusy, setLogoBusy] = useState(false)
  const [logoKey, setLogoKey] = useState(0)
  const [landBgBusy, setLandBgBusy] = useState(false)
  const [sessionHeaderBgBusy, setSessionHeaderBgBusy] = useState(false)
  const [editorWorkspaceBgBusy, setEditorWorkspaceBgBusy] = useState(false)
  const [uploadDestination, setUploadDestination] = useState('dropbox')
  const [smbHost, setSmbHost] = useState('')
  const [smbShare, setSmbShare] = useState('')
  const [smbPathPrefix, setSmbPathPrefix] = useState('')
  const [smbDomain, setSmbDomain] = useState('')
  const [smbUsername, setSmbUsername] = useState('')
  const [smbPasswordInput, setSmbPasswordInput] = useState('')
  const [smbPasswordSet, setSmbPasswordSet] = useState(false)

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
        try {
          const stRes = await apiFetch('/api/admin/upload-storage', { cache: 'no-store' })
          if (stRes.ok) {
            const sd = await parseResponse(stRes)
            if (sd?.uploadDestination === 'smb') setUploadDestination('smb')
            else setUploadDestination('dropbox')
            if (typeof sd?.smbHost === 'string') setSmbHost(sd.smbHost)
            if (typeof sd?.smbShare === 'string') setSmbShare(sd.smbShare)
            if (typeof sd?.smbPathPrefix === 'string') setSmbPathPrefix(sd.smbPathPrefix)
            if (typeof sd?.smbDomain === 'string') setSmbDomain(sd.smbDomain)
            if (typeof sd?.smbUsername === 'string') setSmbUsername(sd.smbUsername)
            setSmbPasswordSet(Boolean(sd?.smbPasswordSet))
            if (typeof sd?.smbPassword === 'string' && sd.smbPassword) setSmbPasswordInput(sd.smbPassword)
            else setSmbPasswordInput('')
          }
        } catch {
          /* ignore */
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

  const uploadSessionHeaderBackground = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setErr('')
    setMsg('')
    setSessionHeaderBgBusy(true)
    try {
      const fd = new FormData()
      fd.append('sessionHeaderBackground', f)
      const res = await apiFetch('/api/admin/session-header-background', { method: 'POST', body: fd })
      const data = await parseResponse(res)
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Upload failed.')
      setMsg('Session header strip background updated. Refresh the user page to see it.')
    } catch (er) {
      setErr(er?.message || 'Could not upload session header background.')
    } finally {
      setSessionHeaderBgBusy(false)
    }
  }

  const clearSessionHeaderBackground = async () => {
    if (!window.confirm('Remove the custom background behind the session header (logo / Leave / timer)?')) return
    setErr('')
    setMsg('')
    setSessionHeaderBgBusy(true)
    try {
      const res = await apiFetch('/api/admin/session-header-background', { method: 'DELETE' })
      const data = await parseResponse(res)
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Remove failed.')
      setMsg('Session header background removed.')
    } catch (er) {
      setErr(er?.message || 'Could not remove session header background.')
    } finally {
      setSessionHeaderBgBusy(false)
    }
  }

  const uploadEditorWorkspaceBackground = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setErr('')
    setMsg('')
    setEditorWorkspaceBgBusy(true)
    try {
      const fd = new FormData()
      fd.append('editorWorkspaceBackground', f)
      const res = await apiFetch('/api/admin/editor-workspace-background', { method: 'POST', body: fd })
      const data = await parseResponse(res)
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Upload failed.')
      setMsg('Editor workspace background updated. Refresh the user page to see it.')
    } catch (er) {
      setErr(er?.message || 'Could not upload editor workspace background.')
    } finally {
      setEditorWorkspaceBgBusy(false)
    }
  }

  const clearEditorWorkspaceBackground = async () => {
    if (!window.confirm('Remove the custom background around the Express canvas?')) return
    setErr('')
    setMsg('')
    setEditorWorkspaceBgBusy(true)
    try {
      const res = await apiFetch('/api/admin/editor-workspace-background', { method: 'DELETE' })
      const data = await parseResponse(res)
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Remove failed.')
      setMsg('Editor workspace background removed.')
    } catch (er) {
      setErr(er?.message || 'Could not remove editor workspace background.')
    } finally {
      setEditorWorkspaceBgBusy(false)
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

  const saveUploadStorage = async (e) => {
    e.preventDefault()
    setErr('')
    setMsg('')
    setSaving(true)
    try {
      const payload = { uploadDestination }
      if (uploadDestination === 'smb') {
        payload.smbHost = smbHost.trim()
        payload.smbShare = smbShare.trim()
        payload.smbPathPrefix = smbPathPrefix.trim()
        payload.smbDomain = smbDomain.trim()
        payload.smbUsername = smbUsername.trim()
        if (smbPasswordInput.trim()) payload.smbPassword = smbPasswordInput.trim()
      }
      const res = await apiFetch('/api/admin/upload-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await parseResponse(res)
      if (!res.ok) throw new Error(toFriendlyError(res, data, 'Could not save upload destination.'))
      if (data?.uploadDestination === 'smb') setUploadDestination('smb')
      else setUploadDestination('dropbox')
      if (typeof data?.smbHost === 'string') setSmbHost(data.smbHost)
      if (typeof data?.smbShare === 'string') setSmbShare(data.smbShare)
      if (typeof data?.smbPathPrefix === 'string') setSmbPathPrefix(data.smbPathPrefix)
      if (typeof data?.smbDomain === 'string') setSmbDomain(data.smbDomain)
      if (typeof data?.smbUsername === 'string') setSmbUsername(data.smbUsername)
      setSmbPasswordSet(Boolean(data?.smbPasswordSet))
      if (typeof data?.smbPassword === 'string' && data.smbPassword) setSmbPasswordInput(data.smbPassword)
      else setSmbPasswordInput('')
      setMsg('Guest export destination updated.')
    } catch (err) {
      setErr(err?.message || 'Could not save upload destination.')
    } finally {
      setSaving(false)
    }
  }

  const clearSmbPassword = async () => {
    if (!window.confirm('Clear the saved SMB password?')) return
    setErr('')
    setMsg('')
    setSaving(true)
    try {
      const res = await apiFetch('/api/admin/upload-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearSmbPassword: true }),
      })
      const data = await parseResponse(res)
      if (!res.ok) throw new Error(toFriendlyError(res, data, 'Could not clear SMB password.'))
      setSmbPasswordSet(Boolean(data?.smbPasswordSet))
      setSmbPasswordInput(data?.smbPassword && typeof data.smbPassword === 'string' ? data.smbPassword : '')
      setMsg('SMB password cleared.')
    } catch (e) {
      setErr(e?.message || 'Could not clear SMB password.')
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
          submissionThankYouMessage: thankYouDraft,
        }),
      })
      const data = await parseResponse(res)
      if (!res.ok) {
        throw new Error(toFriendlyError(res, data, 'Could not save content settings.'))
      }
      if (typeof data?.submissionThankYouMessage === 'string') {
        setThankYouDraft(data.submissionThankYouMessage)
      }
      setMsg('Thank-you message updated.')
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
        Branding, content, landing background, guest export destination (Dropbox or SMB), timer, and passwords.
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
            Shown on the template picker and beside the guest&apos;s design in Express. Any file type is allowed.
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
                accept="*/*"
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
            Gallery, session banner, experience logo, and landing background accept any file type the browser can
            pick.
          </p>
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
            Full-page backdrop behind the template picker. Any image or file type is accepted. Leave empty for the
            default gradient.
          </p>
          <div className="adminSettings__btnRow">
            <label className="btn btn--adminPrimary btn--small">
              {landBgBusy ? 'Working…' : 'Upload background'}
              <input
                type="file"
                className="adminGallery__fileInput"
                accept="*/*"
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

        <div className="adminSettings__card">
          <div className="adminSettings__cardHead">
            <span className="adminSettings__badge adminSettings__badge--site">Session</span>
            <p className="adminSettings__cardTitle">Header strip background</p>
          </div>
          <p className="adminSettings__hint">
            Full-width backdrop behind the logo, gallery thumbnail, Leave, and timer while a guest is editing. Separate
            from the landing page background.
          </p>
          <div className="adminSettings__btnRow">
            <label className="btn btn--adminPrimary btn--small">
              {sessionHeaderBgBusy ? 'Working…' : 'Upload strip background'}
              <input
                type="file"
                className="adminGallery__fileInput"
                accept="*/*"
                disabled={sessionHeaderBgBusy || loading}
                onChange={uploadSessionHeaderBackground}
              />
            </label>
            <button
              type="button"
              className="btn btn--adminSoft btn--small"
              disabled={sessionHeaderBgBusy || loading}
              onClick={clearSessionHeaderBackground}
            >
              Remove strip background
            </button>
          </div>
        </div>

        <div className="adminSettings__card">
          <div className="adminSettings__cardHead">
            <span className="adminSettings__badge adminSettings__badge--site">Session</span>
            <p className="adminSettings__cardTitle">Editor workspace background</p>
          </div>
          <p className="adminSettings__hint">
            Area around the embedded Adobe Express frame (the light page chrome). Optional image; if removed, the default
            light background is used.
          </p>
          <div className="adminSettings__btnRow">
            <label className="btn btn--adminPrimary btn--small">
              {editorWorkspaceBgBusy ? 'Working…' : 'Upload workspace background'}
              <input
                type="file"
                className="adminGallery__fileInput"
                accept="*/*"
                disabled={editorWorkspaceBgBusy || loading}
                onChange={uploadEditorWorkspaceBackground}
              />
            </label>
            <button
              type="button"
              className="btn btn--adminSoft btn--small"
              disabled={editorWorkspaceBgBusy || loading}
              onClick={clearEditorWorkspaceBackground}
            >
              Remove workspace background
            </button>
          </div>
        </div>

        <form className="adminSettings__card" onSubmit={saveUploadStorage}>
          <div className="adminSettings__cardHead">
            <span className="adminSettings__badge adminSettings__badge--site">Export</span>
            <p className="adminSettings__cardTitle">Guest design upload destination</p>
          </div>
          <p className="adminSettings__hint">
            Where Adobe Express &quot;Export &amp; upload&quot; files are stored. Dropbox uses your existing API
            credentials. SMB/CIFS uses the <code className="adminSettings__code">smbclient</code> command on the server
            (install Samba client on Linux; see README for network constraints).
          </p>
          <label className="adminSettings__label" htmlFor="upload-destination">
            Destination
          </label>
          <select
            id="upload-destination"
            className="adminSettings__input"
            value={uploadDestination}
            onChange={(e) => setUploadDestination(e.target.value)}
            disabled={saving || loading || unsupported}
          >
            <option value="dropbox">Dropbox</option>
            <option value="smb">SMB / CIFS (network share)</option>
          </select>
          {uploadDestination === 'smb' ? (
            <>
              <label className="adminSettings__label" htmlFor="smb-host">
                Server (host or IP)
              </label>
              <input
                id="smb-host"
                className="adminSettings__input adminSettings__input--pw"
                type="text"
                autoComplete="off"
                spellCheck="false"
                value={smbHost}
                onChange={(e) => setSmbHost(e.target.value)}
                placeholder="fileserver.example.com"
                disabled={saving || loading || unsupported}
              />
              <label className="adminSettings__label" htmlFor="smb-share">
                Share name
              </label>
              <input
                id="smb-share"
                className="adminSettings__input adminSettings__input--pw"
                type="text"
                autoComplete="off"
                spellCheck="false"
                value={smbShare}
                onChange={(e) => setSmbShare(e.target.value)}
                placeholder="kiosk-uploads"
                disabled={saving || loading || unsupported}
              />
              <label className="adminSettings__label" htmlFor="smb-path">
                Folder inside share (optional)
              </label>
              <input
                id="smb-path"
                className="adminSettings__input adminSettings__input--pw"
                type="text"
                autoComplete="off"
                spellCheck="false"
                value={smbPathPrefix}
                onChange={(e) => setSmbPathPrefix(e.target.value)}
                placeholder="exports/guest"
                disabled={saving || loading || unsupported}
              />
              <label className="adminSettings__label" htmlFor="smb-domain">
                Domain (optional)
              </label>
              <input
                id="smb-domain"
                className="adminSettings__input"
                type="text"
                autoComplete="off"
                spellCheck="false"
                value={smbDomain}
                onChange={(e) => setSmbDomain(e.target.value)}
                placeholder="WORKGROUP"
                disabled={saving || loading || unsupported}
              />
              <label className="adminSettings__label" htmlFor="smb-user">
                Username
              </label>
              <input
                id="smb-user"
                className="adminSettings__input adminSettings__input--pw"
                type="text"
                autoComplete="off"
                spellCheck="false"
                value={smbUsername}
                onChange={(e) => setSmbUsername(e.target.value)}
                disabled={saving || loading || unsupported}
              />
              <label className="adminSettings__label" htmlFor="smb-pass">
                Password {smbPasswordSet ? '(saved — enter new to change)' : ''}
              </label>
              <input
                id="smb-pass"
                className="adminSettings__input adminSettings__input--pw"
                type="password"
                autoComplete="new-password"
                spellCheck="false"
                value={smbPasswordInput}
                onChange={(e) => setSmbPasswordInput(e.target.value)}
                disabled={saving || loading || unsupported}
              />
              <div className="adminSettings__btnRow">
                <button
                  type="button"
                  className="btn btn--adminSoft btn--small"
                  disabled={saving || loading || unsupported || !smbPasswordSet}
                  onClick={clearSmbPassword}
                >
                  Clear SMB password
                </button>
              </div>
            </>
          ) : null}
          <button type="submit" className="btn btn--adminPrimary btn--small" disabled={saving || loading || unsupported}>
            Save upload destination
          </button>
        </form>

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
