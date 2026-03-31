export function FileNameModal({ variant = 'finish', value, onChange, onConfirm, onCancel }) {
  const isStart = variant === 'start'
  const title = isStart ? 'Pickup name' : 'Your name'
  const hintLead = isStart
    ? 'Please enter the name you will use when you pickup the item.'
    : 'This should match the name you are using for pickup.'
  const hintMuted = isStart
    ? 'Your file will be saved as this name plus the date and time (so each export is unique). Then use Export & upload in Adobe Express.'
    : 'Then use Export & upload in Adobe Express.'
  const placeholder = isStart ? 'Pickup name' : 'Your name'

  return (
    <div className="modalRoot" role="dialog" aria-modal="true" aria-labelledby="fn-title">
      <button type="button" className="modalRoot__scrim" aria-label="Close" onClick={onCancel} />
      <div className="modalCard">
        <h2 id="fn-title" className="modalCard__title">
          {title}
        </h2>
        <p className="modalCard__hint modalCard__hint--lead">{hintLead}</p>
        <p className="modalCard__hint modalCard__hint--muted">{hintMuted}</p>
        <input
          id="file-name-input"
          className="modalCard__input"
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
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
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
