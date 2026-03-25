import './App.css'
import { useState } from 'react'
import { BannerHeroUpload } from './components/microsite/BannerHeroUpload.jsx'
import { ExpressEditorHost } from './components/microsite/ExpressEditorHost.jsx'
import { ErrorBanner } from './components/microsite/ErrorBanner.jsx'
import { FileNameModal } from './components/microsite/FileNameModal.jsx'
import { LandingHero } from './components/microsite/LandingHero.jsx'
import { LeaveConfirmModal } from './components/microsite/LeaveConfirmModal.jsx'
import { MicrositeHeader } from './components/microsite/MicrositeHeader.jsx'
import { NoticeBanner } from './components/microsite/NoticeBanner.jsx'
import { SessionBanner } from './components/microsite/SessionBanner.jsx'
import { SessionHeader } from './components/microsite/SessionHeader.jsx'
import { UploadOverlay } from './components/microsite/UploadOverlay.jsx'
import { useMicrositeWorkflow } from './hooks/useMicrositeWorkflow.js'

export default function App() {
  const m = useMicrositeWorkflow()
  const isEditing = m.phase === 'editing'
  const [bannerCacheKey, setBannerCacheKey] = useState(0)

  return (
    <div className={`appRoot${isEditing ? ' appRoot--editing' : ' appRoot--landing'}`}>
      <div className={`shell${isEditing ? ' shell--editing' : ' shell--landing'}`}>
        {!isEditing ? (
          <>
            <MicrositeHeader brandName={m.brandName} />
            <LandingHero
              status={m.status}
              onStart={m.startEditor}
              canStart={m.canStart}
              requireAdobeTemplate={m.requireAdobeTemplate}
              templateConfigured={m.templateConfigured}
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
              brandName={m.brandName}
              remainingSeconds={m.remaining}
              onFinish={m.openFinishModal}
              onLeave={m.openLeaveConfirm}
              uploadBusy={m.uploadBusy}
            />
            <div className="shell__errors shell__errors--session">
              <ErrorBanner message={m.error} />
            </div>
            {m.banner ? <NoticeBanner>{m.banner}</NoticeBanner> : null}
            <BannerHeroUpload
              onUploaded={() => setBannerCacheKey((k) => k + 1)}
              disabled={m.uploadBusy}
            />
            <SessionBanner key={bannerCacheKey} cacheKey={bannerCacheKey} />
            <ExpressEditorHost isActive />
          </>
        )}

        {m.uploadBusy ? <UploadOverlay /> : null}

        {m.showLeaveConfirm ? (
          <LeaveConfirmModal onConfirm={m.confirmLeaveSession} onCancel={m.cancelLeaveConfirm} />
        ) : null}

        {m.showNameModal ? (
          <FileNameModal
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
