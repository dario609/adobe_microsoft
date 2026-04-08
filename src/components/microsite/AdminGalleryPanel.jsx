import { useCallback, useEffect, useState } from 'react'
import { ADOBE_EXPLORE_TEMPLATES_URL } from '../../constants/config.js'
import { apiFetch } from '../../api/apiFetch.js'
import { apiUrl } from '../../api/apiBase.js'
import { useRuntimeConfig } from '../../hooks/useRuntimeConfig.js'
import { validateGalleryDraftLocal, normalizeGalleryTemplateId } from '../../utils/galleryDisplay.js'

async function parseJson(res) {
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json().catch(() => ({}))
  const text = await res.text().catch(() => '')
  return { _text: text }
}

function isHtmlErrorPayload(raw) {
  return (
    raw.includes('<!DOCTYPE') ||
    raw.includes('<pre>') ||
    /Cannot\s+(GET|POST|PATCH|PUT|DELETE)\s+\//i.test(raw)
  )
}

/** Express/HTML error pages → short actionable message. */
function apiFailureMessage(res, data, op = 'load') {
  const raw = typeof data?._text === 'string' ? data._text : ''
  const err = typeof data?.error === 'string' ? data.error : ''
  if (isHtmlErrorPayload(raw)) {
    if (op === 'saveMeta') {
      return 'Could not save changes: API returned 404 (missing POST /api/gallery/:id/meta). Redeploy the latest backend on Render, or set VITE_API_BASE_URL to your Render API URL and rebuild the frontend.'
    }
    if (op === 'patch') {
      return 'Could not save changes: API returned 404 (missing PATCH /api/gallery/:id). Redeploy the latest backend, or set VITE_API_BASE_URL to your Render API URL.'
    }
    if (op === 'replace') {
      return 'Could not replace image: API returned 404 (missing POST /api/gallery/:id/replace). Redeploy the latest backend, or fix VITE_API_BASE_URL.'
    }
    if (op === 'upload') {
      return 'Upload failed: API returned 404 (missing POST /api/gallery). Redeploy the latest backend, or fix VITE_API_BASE_URL.'
    }
    if (op === 'delete') {
      return 'Could not remove: API returned 404. Redeploy the latest backend, or fix VITE_API_BASE_URL.'
    }
    return 'Could not load gallery: API unreachable or wrong VITE_API_BASE_URL. Point it at your Render service URL and redeploy.'
  }
  return err || raw || `Request failed (${res.status}).`
}

export function AdminGalleryPanel() {
  const { contentImageAccept } = useRuntimeConfig()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [uploadTemplateId, setUploadTemplateId] = useState('')
  const [draftById, setDraftById] = useState({})
  /** @type {Record<string, { originalName?: string; templateId?: string }>} */
  const [fieldErrorsById, setFieldErrorsById] = useState({})

  const looksLikeGitHubToken = (s) => /^ghp_[a-zA-Z0-9]{20,}/i.test(String(s || '').trim())

  const load = useCallback(async () => {
    setLoadError('')
    setActionError('')
    setLoading(true)
    try {
      const res = await apiFetch('/api/gallery', { cache: 'no-store' })
      const data = await parseJson(res)
      if (!res.ok) {
        throw new Error(apiFailureMessage(res, data, 'load') || 'Could not load gallery.')
      }
      const list = Array.isArray(data?.items) ? data.items : []
      setItems(list)
      const next = {}
      for (const it of list) {
        next[it.id] = {
          templateId: it.templateId || '',
          originalName: it.originalName || '',
        }
      }
      setDraftById(next)
    } catch (e) {
      setLoadError(e?.message || 'Could not load gallery.')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const setDraft = (id, patch) => {
    setDraftById((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }))
  }

  const clearFieldError = (id, field) => {
    setFieldErrorsById((prev) => {
      const cur = prev[id]
      if (!cur?.[field]) return prev
      const next = { ...cur }
      delete next[field]
      if (Object.keys(next).length === 0) {
        const { [id]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [id]: next }
    })
  }

  const parseUploadError = (res, data) => {
    if (res.status === 409 && typeof data?.error === 'string') return data.error
    return apiFailureMessage(res, data, 'upload') || `Upload failed (${res.status}).`
  }

  /** Upload one file (any type). */
  const uploadOne = async (file) => {
    const fd = new FormData()
    fd.append('images', file)
    const tid = normalizeGalleryTemplateId(uploadTemplateId)
    if (tid) fd.append('templateId', tid)
    const res = await apiFetch('/api/gallery', { method: 'POST', body: fd })
    const data = await parseJson(res)
    if (!res.ok) {
      throw new Error(parseUploadError(res, data))
    }
    const added = Array.isArray(data?.items) ? data.items : []
    if (added.length) {
      setItems((prev) => {
        const ids = new Set(added.map((x) => x.id))
        const rest = prev.filter((p) => !ids.has(p.id))
        return [...added, ...rest]
      })
      setDraftById((prev) => {
        const next = { ...prev }
        for (const it of added) {
          next[it.id] = {
            templateId: it.templateId || '',
            originalName: it.originalName || '',
          }
        }
        return next
      })
    }
  }

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    const tid = normalizeGalleryTemplateId(uploadTemplateId)
    if (!tid) {
      setActionError('Enter the template ID above before uploading — it is required for every image.')
      return
    }
    setActionError('')
    setBusy(true)
    try {
      for (const f of files) {
        await uploadOne(f)
      }
    } catch (err) {
      setActionError(err?.message || 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  const saveMeta = async (id) => {
    const d = draftById[id]
    if (!d) return
    if (looksLikeGitHubToken(d.templateId)) {
      setFieldErrorsById((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          templateId:
            'Template ID looks like a GitHub token (starts with ghp_). Use an Adobe Express template URN (urn:aaid:…), not a GitHub secret.',
        },
      }))
      setActionError(
        'Template ID looks like a GitHub token (starts with ghp_). Use an Adobe Express template URN (urn:aaid:…), not a GitHub secret. Remove this value and revoke that token on GitHub if it was exposed.'
      )
      return
    }
    const localErr = validateGalleryDraftLocal(id, items, d)
    if (localErr) {
      setFieldErrorsById((prev) => ({ ...prev, [id]: { ...prev[id], ...localErr } }))
      setActionError('Fix the highlighted fields before saving.')
      return
    }
    setFieldErrorsById((prev) => {
      const { [id]: _, ...rest } = prev
      return rest
    })
    setActionError('')
    setBusy(true)
    try {
      const body = JSON.stringify({
        templateId: normalizeGalleryTemplateId(d.templateId),
        originalName: d.originalName,
      })
      let res = await apiFetch(`/api/gallery/${encodeURIComponent(id)}/meta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      let data = await parseJson(res)
      if (res.status === 404) {
        res = await apiFetch(`/api/gallery/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body,
        })
        data = await parseJson(res)
      }
      if (res.status === 409) {
        const field = data?.field
        const msg = typeof data?.error === 'string' ? data.error : 'This value is already in use.'
        if (field === 'originalName' || field === 'templateId') {
          setFieldErrorsById((prev) => ({ ...prev, [id]: { ...prev[id], [field]: msg } }))
        }
        setActionError(msg)
        return
      }
      if (!res.ok) throw new Error(apiFailureMessage(res, data, 'saveMeta') || 'Update failed.')
      const it = data?.item
      if (it?.id) {
        setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, ...it } : x)))
        setDraft(it.id, { templateId: it.templateId || '', originalName: it.originalName || '' })
      } else {
        await load()
      }
    } catch (err) {
      setActionError(err?.message || 'Update failed.')
    } finally {
      setBusy(false)
    }
  }

  const replacePng = async (id, file) => {
    setActionError('')
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await apiFetch(`/api/gallery/${encodeURIComponent(id)}/replace`, {
        method: 'POST',
        body: fd,
      })
      const data = await parseJson(res)
      if (!res.ok) throw new Error(apiFailureMessage(res, data, 'replace') || 'Replace failed.')
      const it = data?.item
      if (it?.id) {
        setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, ...it } : x)))
      } else {
        await load()
      }
    } catch (err) {
      setActionError(err?.message || 'Replace failed.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Remove this image from the gallery?')) return
    setActionError('')
    setBusy(true)
    try {
      const res = await apiFetch(`/api/gallery/${encodeURIComponent(id)}`, { method: 'DELETE' })
      const data = await parseJson(res)
      if (!res.ok) throw new Error(apiFailureMessage(res, data, 'delete') || 'Remove failed.')
      setItems((prev) => prev.filter((p) => p.id !== id))
      setDraftById((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      setFieldErrorsById((prev) => {
        const { [id]: _, ...rest } = prev
        return rest
      })
    } catch (err) {
      setActionError(err?.message || 'Remove failed.')
    } finally {
      setBusy(false)
    }
  }

  const thumbSrc = (it) => `${apiUrl(`/api/gallery/image/${it.id}`)}?t=${encodeURIComponent(it.uploadedAt || it.id)}`

  return (
    <div className="adminGallery">
      <div className="adminGallery__toolbar">
        <div className="adminGallery__toolbarRow adminGallery__toolbarRow--singleLine">
          <div className="adminGallery__field adminGallery__field--toolbar">
            <label className="adminGallery__fieldLabel" htmlFor="upload-template-id">
              Template ID (required)
            </label>
            <input
              id="upload-template-id"
              className="adminGallery__textInput adminGallery__textInput--template adminGallery__textInput--toolbarTemplate"
              type="text"
              placeholder="Adobe template URN or URL"
              value={uploadTemplateId}
              onChange={(e) => setUploadTemplateId(e.target.value)}
              disabled={busy}
            />
          </div>
          <label className="btn btn--adminPrimary btn--small adminGallery__fileLabel">
            {busy ? 'Working…' : 'Upload files'}
            <input
              className="adminGallery__fileInput"
              type="file"
              accept={contentImageAccept}
              multiple
              disabled={busy}
              onChange={onFiles}
            />
          </label>
          <a
            className="btn btn--adminOutline btn--small adminGallery__browseTemplates"
            href={ADOBE_EXPLORE_TEMPLATES_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Browse Adobe templates
          </a>
        </div>
      </div>
      {loadError ? (
        <p className="appError appError--standalone adminGallery__error" role="alert">
          {loadError}
        </p>
      ) : null}
      {actionError ? (
        <p className="adminGallery__actionError" role="alert">
          {actionError}
        </p>
      ) : null}
      {loading ? <p className="adminGallery__loading">Loading gallery…</p> : null}
      <ul className="adminGallery__grid" role="list">
        {!loading && items.length === 0 ? (
          <li className="adminGallery__empty">No images uploaded yet.</li>
        ) : null}
        {items.map((it) => {
          const d = draftById[it.id] || { templateId: '', originalName: it.originalName || '' }
          const fe = fieldErrorsById[it.id] || {}
          const ext = (it.fileExt || 'png').toLowerCase()
          const isPdf = ext === 'pdf'
          return (
            <li key={it.id} className="adminGallery__card">
              <div className="adminGallery__thumbWrap">
                {isPdf ? (
                  <div className="adminGallery__thumb adminGallery__thumb--pdf" aria-hidden>
                    PDF
                  </div>
                ) : (
                  <img className="adminGallery__thumb" src={thumbSrc(it)} alt="" loading="lazy" />
                )}
              </div>
              <label className="adminGallery__miniLabel" htmlFor={`name-${it.id}`}>
                Display name
              </label>
              <input
                id={`name-${it.id}`}
                className={`adminGallery__textInput${fe.originalName ? ' adminGallery__textInput--invalid' : ''}`}
                type="text"
                value={d.originalName}
                onChange={(e) => {
                  setDraft(it.id, { originalName: e.target.value })
                  clearFieldError(it.id, 'originalName')
                }}
                disabled={busy}
                aria-invalid={Boolean(fe.originalName)}
                aria-describedby={fe.originalName ? `name-err-${it.id}` : undefined}
              />
              {fe.originalName ? (
                <p id={`name-err-${it.id}`} className="adminGallery__fieldError" role="alert">
                  {fe.originalName}
                </p>
              ) : null}
              <label className="adminGallery__miniLabel" htmlFor={`tpl-${it.id}`}>
                Template ID
              </label>
              <input
                id={`tpl-${it.id}`}
                className={`adminGallery__textInput adminGallery__textInput--template${
                  fe.templateId ? ' adminGallery__textInput--invalid' : ''
                }`}
                type="text"
                placeholder="Required — Adobe template URN or URL"
                value={d.templateId}
                onChange={(e) => {
                  setDraft(it.id, { templateId: e.target.value })
                  clearFieldError(it.id, 'templateId')
                }}
                disabled={busy}
                aria-invalid={Boolean(fe.templateId)}
                aria-describedby={fe.templateId ? `tpl-err-${it.id}` : undefined}
              />
              {fe.templateId ? (
                <p id={`tpl-err-${it.id}`} className="adminGallery__fieldError" role="alert">
                  {fe.templateId}
                </p>
              ) : null}
              <label className="btn btn--adminSoft btn--small adminGallery__fileLabel adminGallery__replacePng">
                Replace image
                <input
                  className="adminGallery__fileInput"
                  type="file"
                  accept={contentImageAccept}
                  disabled={busy}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    e.target.value = ''
                    if (f) replacePng(it.id, f)
                  }}
                />
              </label>
              <div className="adminGallery__cardActions adminGallery__cardActions--two">
                <button
                  type="button"
                  className="btn btn--adminPrimary btn--small adminGallery__actionBtn"
                  disabled={busy}
                  onClick={() => saveMeta(it.id)}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn--adminDanger btn--small adminGallery__actionBtn"
                  disabled={busy}
                  onClick={() => remove(it.id)}
                >
                  Remove
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
