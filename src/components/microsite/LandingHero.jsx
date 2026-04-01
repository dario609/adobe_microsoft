import { LandingGallery } from './LandingGallery.jsx'

export function LandingHero({
  status,
  onStart,
  canStart,
  onGallerySelectionChange,
}) {
  const startDisabled = !canStart
  const startLabel =
    status === 'loading' ? 'Preparing…' : status === 'error' ? 'Unavailable' : 'Start'

  return (
    <section className="landHero" aria-label="Session">
      <LandingGallery onSelectionChange={onGallerySelectionChange} />
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
      <p
        className={`landHero__status${status === 'ready' || status === 'loading' ? ' landHero__status--center' : ''}`}
        aria-live="polite"
      >
        {status === 'loading' && <span>Connecting to Adobe Express…</span>}
        {status === 'ready' && <span>Choose a template and press start.</span>}
        {status === 'error' && (
          <span>
            Could not load Adobe. Check <code>VITE_ADOBE_CLIENT_ID</code> and that this site URL is allowed in your Adobe project.
          </span>
        )}
      </p>
    </section>
  )
}
