export function FileNameModal({ value, onChange, onConfirm, onCancel }) {
  return (
    <div className="modalRoot" role="dialog" aria-modal="true" aria-labelledby="fn-title">
      <button type="button" className="modalRoot__scrim" aria-label="Close" onClick={onCancel} />
      <div className="modalCard">
        <h2 id="fn-title" className="modalCard__title">
          Your Name
        </h2>
        <p className="modalCard__hint modalCard__hint--lead">
          This should match the name you&apos;re using for pickup.
        </p>
        <p className="modalCard__hint modalCard__hint--muted">Then use Export & upload in Adobe Express.</p>
        <input
          id="file-name-input"
          className="modalCard__input"
          type="text"
          inputMode="text"
          autoComplete="name"
          autoFocus
          placeholder="Your name"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm()
          }}
        />
        <div className="modalCard__row">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn--primary" onClick={onConfirm}>
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
