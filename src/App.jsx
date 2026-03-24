import './App.css'
import { ExpressEditorHost } from './components/microsite/ExpressEditorHost.jsx'
import { ErrorBanner } from './components/microsite/ErrorBanner.jsx'
import { FileNameModal } from './components/microsite/FileNameModal.jsx'
import { LandingHero } from './components/microsite/LandingHero.jsx'
import { MicrositeHeader } from './components/microsite/MicrositeHeader.jsx'
import { NoticeBanner } from './components/microsite/NoticeBanner.jsx'
import { SessionHeader } from './components/microsite/SessionHeader.jsx'
import { UploadOverlay } from './components/microsite/UploadOverlay.jsx'
import { useMicrositeWorkflow } from './hooks/useMicrositeWorkflow.js'

export default function App() {
  const m = useMicrositeWorkflow()
  const isEditing = m.phase === 'editing'

  return (
    <div className={`appRoot${isEditing ? ' appRoot--editing' : ''}`}>
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
              onLeave={m.resetSession}
              uploadBusy={m.uploadBusy}
            />
            <div className="shell__errors shell__errors--session">
              <ErrorBanner message={m.error} />
            </div>
            {m.banner ? <NoticeBanner>{m.banner}</NoticeBanner> : null}
            <ExpressEditorHost isActive />
          </>
        )}

        {m.uploadBusy ? <UploadOverlay /> : null}

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
