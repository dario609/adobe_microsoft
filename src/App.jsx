import './App.css'
import { ExpressEditorHost } from './components/microsite/ExpressEditorHost.jsx'
import { ErrorBanner } from './components/microsite/ErrorBanner.jsx'
import { FileNameModal } from './components/microsite/FileNameModal.jsx'
import { LandingHero } from './components/microsite/LandingHero.jsx'
import { MicrositeHeader } from './components/microsite/MicrositeHeader.jsx'
import { NoticeBanner } from './components/microsite/NoticeBanner.jsx'
import { SessionBar } from './components/microsite/SessionBar.jsx'
import { UploadOverlay } from './components/microsite/UploadOverlay.jsx'
import { useMicrositeWorkflow } from './hooks/useMicrositeWorkflow.js'

export default function App() {
  const m = useMicrositeWorkflow()
  const isEditing = m.phase === 'editing'

  return (
    <div className="microsite">
      <MicrositeHeader brandName={m.brandName} />

      {m.phase === 'landing' && (
        <LandingHero
          status={m.status}
          onStart={m.startEditor}
          canStart={m.canStart}
          requireAdobeTemplate={m.requireAdobeTemplate}
          templateConfigured={m.templateConfigured}
        />
      )}

      {isEditing && (
        <SessionBar
          remainingSeconds={m.remaining}
          onFinish={m.openFinishModal}
          uploadBusy={m.uploadBusy}
        />
      )}

      {m.banner && isEditing && <NoticeBanner>{m.banner}</NoticeBanner>}

      <ExpressEditorHost isActive={isEditing} />

      {m.uploadBusy && <UploadOverlay />}

      {m.showNameModal && (
        <FileNameModal
          value={m.nameInput}
          onChange={m.setNameInput}
          onConfirm={m.confirmFileName}
          onCancel={m.cancelNameModal}
        />
      )}

      <ErrorBanner message={m.error} />

      {m.status === 'error' && !m.error && (
        <p className="microsite__error">Adobe Express could not be loaded.</p>
      )}
    </div>
  )
}
