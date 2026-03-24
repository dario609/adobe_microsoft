export function FileNameModal({ value, onChange, onConfirm, onCancel }) {
  return (
    <div
      className="microsite__modalRoot"
      role="dialog"
      aria-modal="true"
      aria-labelledby="filename-dialog-title"
    >
      <div className="microsite__modalBackdrop" onClick={onCancel} />
      <div className="microsite__modal">
        <h2 id="filename-dialog-title" className="microsite__modalTitle">
          Name your file
        </h2>
        <p className="microsite__modalHint">
          File name only (no extension). After you continue, export from Adobe Express — the file uploads
          to Dropbox automatically, then this session resets.
        </p>
        <label className="microsite__label" htmlFor="file-name-input">
          File name
        </label>
        <input
          id="file-name-input"
          className="microsite__input"
          type="text"
          autoComplete="off"
          autoFocus
          placeholder="e.g. spring-campaign"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm()
          }}
        />
        <div className="microsite__modalActions">
          <button type="button" className="microsite__btn microsite__btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="microsite__btn microsite__btn--primary" onClick={onConfirm}>
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
