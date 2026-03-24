import { USER_FLOW_STEPS } from '../../constants/flow.js'

export function LandingHero({ status, onStart, canStart, requireAdobeTemplate, templateConfigured }) {
  const startDisabled = !canStart
  const startLabel =
    status === 'loading' ? 'Preparing…' : status === 'error' ? 'Unavailable' : 'Start'

  return (
    <section className="microsite__hero" aria-label="How it works">
      <ol className="microsite__flowList">
        {USER_FLOW_STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <button
        type="button"
        className="microsite__btn microsite__btn--primary"
        onClick={onStart}
        disabled={startDisabled}
      >
        {startLabel}
      </button>
      <p className="microsite__status" aria-live="polite">
        {status === 'loading' && <span>Adobe Express: connecting…</span>}
        {status === 'ready' && requireAdobeTemplate && !templateConfigured && (
          <span>
            Set <code>VITE_ADOBE_TEMPLATE_ID</code> in <code>.env</code> (required for this deployment),
            then restart Vite.
          </span>
        )}
        {status === 'ready' && !(requireAdobeTemplate && !templateConfigured) && (
          <span>
            {templateConfigured
              ? 'Adobe Express: ready — opens with your template.'
              : 'Adobe Express: ready — no template ID; a blank canvas is used. Add VITE_ADOBE_TEMPLATE_ID for a fixed template.'}
          </span>
        )}
        {status === 'error' && (
          <span>
            Adobe Express could not start. Check <code>VITE_ADOBE_CLIENT_ID</code> and that this URL
            is allowed in your Adobe app (e.g. <code>https://127.0.0.1:5173</code>). Restart Vite after
            changing <code>.env</code>.
          </span>
        )}
      </p>
    </section>
  )
}
