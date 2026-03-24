export function FileNameModal({ value, onChange, onConfirm, onCancel }) {
  return (
    <div className="modalRoot" role="dialog" aria-modal="true" aria-labelledby="fn-title">
      <button type="button" className="modalRoot__scrim" aria-label="Close" onClick={onCancel} />
      <div className="modalCard">
        <h2 id="fn-title" className="modalCard__title">
          File name
        </h2>
        <p className="modalCard__hint">No extension. Then use Export & upload in Adobe.</p>
        <input
          id="file-name-input"
          className="modalCard__input"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoFocus
          placeholder="my-design"
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
