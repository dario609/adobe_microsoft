import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch, getSiteGateToken, setSiteGateToken } from '../api/apiFetch.js'
import { RuntimeConfigContext } from './runtimeConfigContext.js'

export function RuntimeConfigProvider({ children }) {
  const [ready, setReady] = useState(false)
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [showSessionTimer, setShowSessionTimer] = useState(false)
  const [sitePasswordRequired, setSitePasswordRequired] = useState(false)
  const [siteAuthOk, setSiteAuthOk] = useState(false)

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
    } catch (e) {
      console.error('RuntimeConfig:', e)
      setSitePasswordRequired(false)
      setSiteAuthOk(true)
    } finally {
      setReady(true)
    }
  }, [refreshAuth])

  useEffect(() => {
    const t = setTimeout(() => {
      refresh()
    }, 0)
    return () => clearTimeout(t)
  }, [refresh])

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

  const value = useMemo(
    () => ({
      ready,
      sessionSeconds,
      showSessionTimer,
      sitePasswordRequired,
      siteAuthOk,
      loginSite,
      refreshAuth,
    }),
    [ready, sessionSeconds, showSessionTimer, sitePasswordRequired, siteAuthOk, loginSite, refreshAuth]
  )

  return <RuntimeConfigContext.Provider value={value}>{children}</RuntimeConfigContext.Provider>
}
