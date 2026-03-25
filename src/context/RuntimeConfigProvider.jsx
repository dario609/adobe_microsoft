import { useCallback, useEffect, useMemo, useState } from 'react'
import { RuntimeConfigContext } from './runtimeConfigContext.js'

function clientFallbackTimer() {
  const raw = import.meta.env.VITE_SESSION_SECONDS
  let seconds = 0
  if (raw !== undefined && String(raw).trim() !== '') {
    const n = parseInt(String(raw).trim(), 10)
    if (Number.isFinite(n) && n > 0) seconds = n
  }
  const showFlag = import.meta.env.VITE_SHOW_SESSION_TIMER
  const off = ['false', '0', 'no', 'off'].includes(String(showFlag ?? '').trim().toLowerCase())
  const showSessionTimer = seconds > 0 && !off
  return { sessionSeconds: seconds, showSessionTimer }
}

export function RuntimeConfigProvider({ children }) {
  const [ready, setReady] = useState(false)
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [showSessionTimer, setShowSessionTimer] = useState(false)
  const [sitePasswordRequired, setSitePasswordRequired] = useState(false)
  const [siteAuthOk, setSiteAuthOk] = useState(true)

  const refresh = useCallback(async () => {
    let timer = clientFallbackTimer()
    let gate = { required: false, ok: true }

    try {
      const [cRes, aRes] = await Promise.all([
        fetch('/api/config', { credentials: 'include' }),
        fetch('/api/auth/site', { credentials: 'include' }),
      ])
      if (cRes.ok) {
        const c = await cRes.json()
        timer = {
          sessionSeconds: Math.max(0, Number(c.sessionSeconds) || 0),
          showSessionTimer: Boolean(c.showSessionTimer),
        }
      }
      if (aRes.ok) {
        const a = await aRes.json()
        gate = { required: Boolean(a.required), ok: Boolean(a.ok) }
      }
    } catch {
      /* use fallbacks */
    }

    setSessionSeconds(timer.sessionSeconds)
    setShowSessionTimer(timer.showSessionTimer)
    setSitePasswordRequired(gate.required)
    setSiteAuthOk(gate.ok)
    setReady(true)
  }, [])

  useEffect(() => {
    const id = setTimeout(() => {
      void refresh()
    }, 0)
    return () => clearTimeout(id)
  }, [refresh])

  const loginSite = useCallback(
    async (password) => {
      const res = await fetch('/api/auth/site/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Sign-in failed.')
      }
      await refresh()
    },
    [refresh]
  )

  const value = useMemo(
    () => ({
      ready,
      sessionSeconds,
      showSessionTimer,
      sitePasswordRequired,
      siteAuthOk,
      loginSite,
      refreshAuth: refresh,
    }),
    [ready, sessionSeconds, showSessionTimer, sitePasswordRequired, siteAuthOk, loginSite, refresh]
  )

  return <RuntimeConfigContext.Provider value={value}>{children}</RuntimeConfigContext.Provider>
}
