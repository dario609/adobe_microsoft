export function FileNameModal({ variant = 'finish', value, onChange, onConfirm, onCancel }) {
  const isStart = variant === 'start'
  const title = isStart ? 'Before you start' : 'Finish & export'
  const hintLead = isStart
    ? 'Please enter the name you will use when you pickup the item.'
    : 'Confirm or update your pickup name.'
  const hintMuted = isStart
    ? 'We will save your design under this name plus the date and time when you tap Export & upload in Express (each save gets a unique file name).'
    : 'The same rule applies: your file will be saved as this name plus the date and time when you export (so every upload is unique).'
  const placeholder = isStart ? 'Pickup name' : 'Pickup name'

  return (
    <div className="modalRoot modalRoot--pickup" role="dialog" aria-modal="true" aria-labelledby="fn-title">
      <button type="button" className="modalRoot__scrim" aria-label="Close" onClick={onCancel} />
      <div className="modalCard modalCard--pickup">
        <h2 id="fn-title" className="modalCard__title">
          {title}
        </h2>
        <p className="modalCard__hint modalCard__hint--lead">{hintLead}</p>
        <p className="modalCard__hint modalCard__hint--muted">{hintMuted}</p>
        <input
          id="file-name-input"
          className="modalCard__input modalCard__input--pickup"
          type="text"
          inputMode="text"
          autoComplete="name"
          autoFocus
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm()
          }}
        />
        <div className="modalCard__row">
          <button type="button" className="btn btn--ghost btn--pickupGhost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn--primary" onClick={onConfirm}>
            {isStart ? 'Start Express' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
