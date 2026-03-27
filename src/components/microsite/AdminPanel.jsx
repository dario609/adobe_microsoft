import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../../api/apiFetch.js'
import { API_BASE_URL } from '../../api/apiBase.js'
import { BannerHeroUpload } from './BannerHeroUpload.jsx'

function formatBytes(n) {
  const v = Number(n) || 0
  if (v < 1024) return `${v} B`
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`
  return `${(v / (1024 * 1024)).toFixed(1)} MB`
}

function fmtDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.valueOf())) return '-'
  return d.toLocaleString()
}

export function AdminPanel() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const res = await apiFetch('/api/admin/uploads', { cache: 'no-store' })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        const msg = typeof data?.error === 'string' ? data.error : 'Could not load uploads.'
        throw new Error(`${msg} (HTTP ${res.status}).`)
      }
      setItems(Array.isArray(data?.items) ? data.items : [])
    } catch (e) {
      setError(e?.message || 'Could not load uploads.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh, refreshKey])

  return (
    <main className="adminRoot">
      <section className="adminCard">
        <div className="adminCard__head">
          <h1 className="adminCard__title">Admin Panel</h1>
          <a className="btn btn--ghost" href="/">
            Open user view
          </a>
        </div>
        <p className="adminCard__sub">Upload the banner image used in the user session header.</p>
        {!API_BASE_URL ? (
          <p className="appError appError--standalone">
            Missing `VITE_API_BASE_URL` on the frontend deployment. Admin actions will fail until it points to your
            backend API domain.
          </p>
        ) : null}
        <BannerHeroUpload
          apiPrefix="/api/admin"
          onUploaded={() => setRefreshKey((k) => k + 1)}
          disabled={false}
        />
      </section>

      <section className="adminCard">
        <div className="adminCard__head">
          <h2 className="adminCard__title adminCard__title--small">Uploaded Work</h2>
          <button className="btn btn--ghost" type="button" onClick={refresh}>
            Refresh
          </button>
        </div>
        {error ? <p className="appError appError--standalone">{error}</p> : null}
        {loading ? <p className="adminTable__empty">Loading uploads…</p> : null}
        {!loading ? (
          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Dropbox path</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="adminTable__empty">
                      No uploads yet.
                    </td>
                  </tr>
                ) : (
                  items.map((it) => (
                    <tr key={it.id}>
                      <td>{it.fileName || '-'}</td>
                      <td className="adminTable__path">{it.dropboxPath || '-'}</td>
                      <td>{formatBytes(it.bytes)}</td>
                      <td>{fmtDate(it.uploadedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  )
}
