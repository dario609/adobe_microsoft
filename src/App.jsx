import './App.css'
import { useEffect, useState } from 'react'
import { apiUrl } from './api/apiBase.js'
import { AdminPasswordGate } from './components/microsite/AdminPasswordGate.jsx'
import { AdminPanel } from './components/microsite/AdminPanel.jsx'
import { ExpressEditorHost } from './components/microsite/ExpressEditorHost.jsx'
import { ErrorBanner } from './components/microsite/ErrorBanner.jsx'
import { FileNameModal } from './components/microsite/FileNameModal.jsx'
import { LandingHero } from './components/microsite/LandingHero.jsx'
import { LeaveConfirmModal } from './components/microsite/LeaveConfirmModal.jsx'
import { SubmissionThanksModal } from './components/microsite/SubmissionThanksModal.jsx'
import { MicrositeHeader } from './components/microsite/MicrositeHeader.jsx'
import { NoticeBanner } from './components/microsite/NoticeBanner.jsx'
import { SessionHeader } from './components/microsite/SessionHeader.jsx'
import { SitePasswordGate } from './components/microsite/SitePasswordGate.jsx'
import { IOSExpressNotice } from './components/microsite/IOSExpressNotice.jsx'
import { UploadOverlay } from './components/microsite/UploadOverlay.jsx'
import { useRuntimeConfig } from './hooks/useRuntimeConfig.js'
import { useMicrositeWorkflow } from './hooks/useMicrositeWorkflow.js'

export default function App() {
  const rt = useRuntimeConfig()
  const isAdminPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')

  if (!rt.ready) {
    return (
      <div className="appBoot">
        <p className="appBoot__text">Loading…</p>
      </div>
    )
  }

  if (!isAdminPath && rt.sitePasswordRequired && !rt.siteAuthOk) {
    return <SitePasswordGate />
  }

  if (isAdminPath) {
    if (rt.adminPasswordRequired && !rt.adminAuthOk) {
      return <AdminPasswordGate />
    }
    return <AdminPanel />
  }

  return <MicrositeRoutes />
}

function useLandingBackgroundStyle() {
  const [style, setStyle] = useState(undefined)
  useEffect(() => {
    let cancelled = false
    let objectUrl = ''
    ;(async () => {
      try {
        const res = await fetch(apiUrl('/api/branding/landing-background'), { cache: 'no-store' })
        if (!res.ok || cancelled) return
        const blob = await res.blob()
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setStyle({
          backgroundImage: `linear-gradient(rgba(250, 250, 255, 0.88), rgba(250, 250, 255, 0.92)), url(${objectUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        })
      } catch {
        if (!cancelled) setStyle(undefined)
      }
    })()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [])
  return style
}

function MicrositeRoutes() {
  const m = useMicrositeWorkflow()
  const isEditing = m.phase === 'editing'
  const [galleryCacheKey, setGalleryCacheKey] = useState(0)
  const landingBgStyle = useLandingBackgroundStyle()

  return (
    <div className={`appRoot${isEditing ? ' appRoot--editing' : ' appRoot--landing'}`}>
      <div
        className={`shell${isEditing ? ' shell--editing' : ' shell--landing'}`}
        style={!isEditing ? landingBgStyle : undefined}
      >
        {!isEditing ? (
          <>
            <MicrositeHeader />
            <LandingHero
              status={m.status}
              onStart={m.openStartPickupModal}
              canStart={m.canStart}
              onGallerySelectionChange={() => setGalleryCacheKey((k) => k + 1)}
            />
            <div className="shell__errors">
              <ErrorBanner message={m.error} />
              {m.status === 'error' && !m.error ? (
                <p className="appError appError--standalone">Adobe Express could not be loaded.</p>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <SessionHeader
              remainingSeconds={m.remaining}
              showTimer={m.showSessionTimer}
              onLeave={m.openLeaveConfirm}
              uploadBusy={m.uploadBusy}
              bannerCacheKey={galleryCacheKey}
            />
            <div className="shell__errors shell__errors--session">
              <ErrorBanner message={m.error} />
            </div>
            <IOSExpressNotice />
            {m.banner ? <NoticeBanner>{m.banner}</NoticeBanner> : null}
            <ExpressEditorHost isActive />
          </>
        )}

        {m.uploadBusy ? <UploadOverlay /> : null}

        {m.showLeaveConfirm ? (
          <LeaveConfirmModal onConfirm={m.confirmLeaveSession} onCancel={m.cancelLeaveConfirm} />
        ) : null}

        {m.showSubmissionThanks ? (
          <SubmissionThanksModal
            message={
              m.submissionThankYouMessage?.trim() ||
              'Thank you for your submission. Please see a brand ambassador for the current pickup wait time.'
            }
            onDismiss={m.dismissSubmissionThanks}
          />
        ) : null}

        {m.showNameModal ? (
          <FileNameModal
            variant="start"
            value={m.nameInput}
            onChange={m.setNameInput}
            onConfirm={m.confirmFileName}
            onCancel={m.cancelNameModal}
          />
        ) : null}
      </div>
    </div>
  )
}
