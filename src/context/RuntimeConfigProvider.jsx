import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  apiFetch,
  getAdminGateToken,
  getSiteGateToken,
  setAdminGateToken,
  setSiteGateToken,
} from '../api/apiFetch.js'
import { RuntimeConfigContext } from './runtimeConfigContext.js'

export function RuntimeConfigProvider({ children }) {
  const [ready, setReady] = useState(false)
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [showSessionTimer, setShowSessionTimer] = useState(false)
  const [sitePasswordRequired, setSitePasswordRequired] = useState(false)
  const [siteAuthOk, setSiteAuthOk] = useState(false)
  const [adminPasswordRequired, setAdminPasswordRequired] = useState(false)
  const [adminAuthOk, setAdminAuthOk] = useState(false)

  const refreshAuth = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ ts: String(Date.now()) })
      const gate = getSiteGateToken()
      if (gate) qs.set('gate', gate)
      const res = await apiFetch(`/api/auth/site?${qs}`, { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setSiteAuthOk(Boolean(data?.ok))
    } catch {
      // Keep last known auth state on transient Safari errors.
    }
  }, [])

  const refreshAdminAuth = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ ts: String(Date.now()) })
      const gate = getAdminGateToken()
      if (gate) qs.set('gate', gate)
      const res = await apiFetch(`/api/auth/admin?${qs}`, { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setAdminAuthOk(Boolean(data?.ok))
    } catch {
      /* keep last known */
    }
  }, [])

  const refresh = useCallback(async () => {
    setReady(false)
    try {
      const cfgRes = await apiFetch('/api/config')
      if (!cfgRes.ok) throw new Error('config')
      const cfg = await cfgRes.json()
      setSessionSeconds(Number(cfg.sessionSeconds) || 0)
      setShowSessionTimer(Boolean(cfg.showSessionTimer))

      const required = Boolean(cfg.sitePasswordRequired)
      setSitePasswordRequired(required)
      if (!required) {
        setSiteAuthOk(true)
      } else {
        await refreshAuth()
      }

      const apReq = Boolean(cfg.adminPasswordRequired)
      setAdminPasswordRequired(apReq)
      if (!apReq) {
        setAdminAuthOk(true)
      } else {
        await refreshAdminAuth()
      }
    } catch (e) {
      console.error('RuntimeConfig:', e)
      setSitePasswordRequired(false)
      setSiteAuthOk(true)
      setAdminPasswordRequired(false)
      setAdminAuthOk(true)
    } finally {
      setReady(true)
    }
  }, [refreshAuth, refreshAdminAuth])

  useEffect(() => {
    const t = setTimeout(() => {
      refresh()
    }, 0)
    return () => clearTimeout(t)
  }, [refresh])

  const reloadConfig = useCallback(async () => {
    try {
      const cfgRes = await apiFetch('/api/config', { cache: 'no-store' })
      if (!cfgRes.ok) return
      const cfg = await cfgRes.json()
      setSessionSeconds(Number(cfg.sessionSeconds) || 0)
      setShowSessionTimer(Boolean(cfg.showSessionTimer))

      const required = Boolean(cfg.sitePasswordRequired)
      setSitePasswordRequired(required)
      if (!required) {
        setSiteAuthOk(true)
      } else {
        await refreshAuth()
      }

      const apReq = Boolean(cfg.adminPasswordRequired)
      setAdminPasswordRequired(apReq)
      if (!apReq) {
        setAdminAuthOk(true)
      } else {
        await refreshAdminAuth()
      }
    } catch (e) {
      console.error('reloadConfig:', e)
    }
  }, [refreshAuth, refreshAdminAuth])

  const loginSite = useCallback(async (password) => {
    const res = await apiFetch('/api/auth/site/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(typeof data?.error === 'string' ? data.error : 'Sign in failed.')
    }
    if (data?.token) {
      setSiteGateToken(data.token)
    }
    // Unlock immediately on successful password match.
    setSiteAuthOk(true)
  }, [])

  const loginAdmin = useCallback(async (password) => {
    const res = await apiFetch('/api/auth/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(typeof data?.error === 'string' ? data.error : 'Sign in failed.')
    }
    if (data?.token) {
      setAdminGateToken(data.token)
    }
    setAdminAuthOk(true)
  }, [])

  const value = useMemo(
    () => ({
      ready,
      sessionSeconds,
      showSessionTimer,
      sitePasswordRequired,
      siteAuthOk,
      adminPasswordRequired,
      adminAuthOk,
      loginSite,
      loginAdmin,
      refreshAuth,
      refreshAdminAuth,
      reloadConfig,
    }),
    [
      ready,
      sessionSeconds,
      showSessionTimer,
      sitePasswordRequired,
      siteAuthOk,
      adminPasswordRequired,
      adminAuthOk,
      loginSite,
      loginAdmin,
      refreshAuth,
      refreshAdminAuth,
      reloadConfig,
    ]
  )

  return <RuntimeConfigContext.Provider value={value}>{children}</RuntimeConfigContext.Provider>
}
