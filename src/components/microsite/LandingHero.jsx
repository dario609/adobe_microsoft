import { USER_FLOW_STEPS } from '../../constants/flow.js'
import { LandingGallery } from './LandingGallery.jsx'

export function LandingHero({
  status,
  onStart,
  canStart,
  requireAdobeTemplate,
  templateConfigured,
  onGallerySelectionChange,
}) {
  const startDisabled = !canStart
  const startLabel =
    status === 'loading' ? 'Preparing…' : status === 'error' ? 'Unavailable' : 'Start'

  return (
    <section className="landHero" aria-label="Session">
      <LandingGallery onSelectionChange={onGallerySelectionChange} />
      <ol className="landHero__steps">
        {USER_FLOW_STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="landHero__cta">
        <button
          type="button"
          className="btn btn--primary btn--large"
          onClick={onStart}
          disabled={startDisabled}
        >
          {startLabel}
        </button>
      </div>
      <p className="landHero__status" aria-live="polite">
        {status === 'loading' && <span>Connecting to Adobe Express…</span>}
        {status === 'ready' && requireAdobeTemplate && !templateConfigured && (
          <span>
            Add <code>VITE_ADOBE_TEMPLATE_ID</code> in <code>.env</code> and restart the dev server.
          </span>
        )}
        {status === 'ready' && !(requireAdobeTemplate && !templateConfigured) && (
          <span>
            {templateConfigured ? 'Ready — opens with your template.' : 'Ready — blank canvas (add a template ID for a fixed design).'}
          </span>
        )}
        {status === 'error' && (
          <span>
            Could not load Adobe. Check <code>VITE_ADOBE_CLIENT_ID</code> and that this site URL is allowed in your Adobe project.
          </span>
        )}
      </p>
    </section>
  )
}
