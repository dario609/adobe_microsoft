import { useCallback, useEffect, useState } from 'react'
import { ADOBE_EXPLORE_TEMPLATES_URL } from '../../constants/config.js'
import { apiFetch } from '../../api/apiFetch.js'
import { apiUrl } from '../../api/apiBase.js'

async function parseJson(res) {
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json().catch(() => ({}))
  const text = await res.text().catch(() => '')
  return { _text: text }
}

/** Express/HTML error pages → short actionable message. */
function apiFailureMessage(res, data) {
  const raw = typeof data?._text === 'string' ? data._text : ''
  const err = typeof data?.error === 'string' ? data.error : ''
  if (
    raw.includes('<!DOCTYPE') ||
    raw.includes('<pre>') ||
    /Cannot\s+(GET|POST|PATCH|PUT|DELETE)\s+\//i.test(raw)
  ) {
    return 'Gallery API missing on the server (redeploy backend), or wrong VITE_API_BASE_URL.'
  }
  return err || raw || `Request failed (${res.status}).`
}

export function AdminGalleryPanel() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [uploadTemplateId, setUploadTemplateId] = useState('')
  const [draftById, setDraftById] = useState({})

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const res = await apiFetch('/api/gallery', { cache: 'no-store' })
      const data = await parseJson(res)
      if (!res.ok) {
        throw new Error(apiFailureMessage(res, data) || 'Could not load gallery.')
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
      setError(e?.message || 'Could not load gallery.')
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

  /** Upload one PNG; optional template ID applies to this upload. */
  const uploadOne = async (file) => {
    const fd = new FormData()
    fd.append('images', file)
    const tid = uploadTemplateId.trim()
    if (tid) fd.append('templateId', tid)
    const res = await apiFetch('/api/gallery', { method: 'POST', body: fd })
    const data = await parseJson(res)
    if (!res.ok) {
      throw new Error(apiFailureMessage(res, data) || `Upload failed (${res.status}).`)
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
    setError('')
    setBusy(true)
    try {
      for (const f of files) {
        await uploadOne(f)
      }
    } catch (err) {
      setError(err?.message || 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  const saveMeta = async (id) => {
    const d = draftById[id]
    if (!d) return
    setError('')
    setBusy(true)
    try {
      const res = await apiFetch(`/api/gallery/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: d.templateId,
          originalName: d.originalName,
        }),
      })
      const data = await parseJson(res)
      if (!res.ok) throw new Error(apiFailureMessage(res, data) || 'Update failed.')
      const it = data?.item
      if (it?.id) {
        setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, ...it } : x)))
        setDraft(it.id, { templateId: it.templateId || '', originalName: it.originalName || '' })
      } else {
        await load()
      }
    } catch (err) {
      setError(err?.message || 'Update failed.')
    } finally {
      setBusy(false)
    }
  }

  const replacePng = async (id, file) => {
    setError('')
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await apiFetch(`/api/gallery/${encodeURIComponent(id)}/replace`, {
        method: 'POST',
        body: fd,
      })
      const data = await parseJson(res)
      if (!res.ok) throw new Error(apiFailureMessage(res, data) || 'Replace failed.')
      const it = data?.item
      if (it?.id) {
        setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, ...it } : x)))
      } else {
        await load()
      }
    } catch (err) {
      setError(err?.message || 'Replace failed.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id) => {
    setError('')
    setBusy(true)
    try {
      const res = await apiFetch(`/api/gallery/${encodeURIComponent(id)}`, { method: 'DELETE' })
      const data = await parseJson(res)
      if (!res.ok) throw new Error(apiFailureMessage(res, data) || 'Remove failed.')
      setItems((prev) => prev.filter((p) => p.id !== id))
      setDraftById((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    } catch (err) {
      setError(err?.message || 'Remove failed.')
    } finally {
      setBusy(false)
    }
  }

  const thumbSrc = (it) => `${apiUrl(`/api/gallery/image/${it.id}`)}?t=${encodeURIComponent(it.uploadedAt || it.id)}`

  return (
    <div className="adminGallery">
      <div className="adminGallery__toolbar">
        <div className="adminGallery__toolbarRow">
          <label className="btn btn--adminGradient btn--small adminGallery__fileLabel">
            {busy ? 'Working…' : 'Upload PNGs'}
            <input
              className="adminGallery__fileInput"
              type="file"
              accept="image/png"
              multiple
              disabled={busy}
              onChange={onFiles}
            />
          </label>
          <div className="adminGallery__field">
            <label className="adminGallery__fieldLabel" htmlFor="upload-template-id">
              Template ID (optional)
            </label>
            <input
              id="upload-template-id"
              className="adminGallery__textInput"
              type="text"
              placeholder="Applied to uploads below"
              value={uploadTemplateId}
              onChange={(e) => setUploadTemplateId(e.target.value)}
              disabled={busy}
            />
          </div>
          <a
            className="adminGallery__templatesLink"
            href={ADOBE_EXPLORE_TEMPLATES_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Browse Adobe templates
          </a>
        </div>
        <p className="adminGallery__toolbarHint">
          Optional template ID opens that design when a guest selects this image and taps Start.
        </p>
      </div>
      {error ? (
        <p className="appError appError--standalone adminGallery__error" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? <p className="adminGallery__loading">Loading gallery…</p> : null}
      <ul className="adminGallery__grid" role="list">
        {!loading && items.length === 0 ? (
          <li className="adminGallery__empty">No PNGs uploaded yet.</li>
        ) : null}
        {items.map((it) => {
          const d = draftById[it.id] || { templateId: '', originalName: it.originalName || '' }
          return (
            <li key={it.id} className="adminGallery__card">
              <div className="adminGallery__thumbWrap">
                <img className="adminGallery__thumb" src={thumbSrc(it)} alt="" loading="lazy" />
              </div>
              <label className="adminGallery__miniLabel" htmlFor={`name-${it.id}`}>
                Display name
              </label>
              <input
                id={`name-${it.id}`}
                className="adminGallery__textInput"
                type="text"
                value={d.originalName}
                onChange={(e) => setDraft(it.id, { originalName: e.target.value })}
                disabled={busy}
              />
              <label className="adminGallery__miniLabel" htmlFor={`tpl-${it.id}`}>
                Template ID
              </label>
              <input
                id={`tpl-${it.id}`}
                className="adminGallery__textInput"
                type="text"
                placeholder="Optional"
                value={d.templateId}
                onChange={(e) => setDraft(it.id, { templateId: e.target.value })}
                disabled={busy}
              />
              <div className="adminGallery__cardActions">
                <button
                  type="button"
                  className="btn btn--adminGradient btn--small"
                  disabled={busy}
                  onClick={() => saveMeta(it.id)}
                >
                  Save changes
                </button>
                <label className="btn btn--adminSoft btn--small adminGallery__fileLabel">
                  Replace PNG
                  <input
                    className="adminGallery__fileInput"
                    type="file"
                    accept="image/png"
                    disabled={busy}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      e.target.value = ''
                      if (f) replacePng(it.id, f)
                    }}
                  />
                </label>
                <a
                  className="btn btn--adminSoft btn--small adminGallery__linkBtn"
                  href={ADOBE_EXPLORE_TEMPLATES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Find templates
                </a>
                <button
                  type="button"
                  className="btn btn--adminDanger btn--small"
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
