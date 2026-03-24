export function LeaveConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="modalRoot modalRoot--confirm" role="dialog" aria-modal="true" aria-labelledby="leave-title">
      <button type="button" className="modalRoot__scrim" aria-label="Dismiss" onClick={onCancel} />
      <div className="modalCard modalCard--confirm">
        <h2 id="leave-title" className="modalCard__title">
          Leave session?
        </h2>
        <p className="modalCard__hint modalCard__hint--lead">
          You will lose any unsaved work in the editor. This cannot be undone.
        </p>
        <div className="modalCard__row modalCard__row--stack">
          <button type="button" className="btn btn--primary btn--block" onClick={onCancel}>
            Stay
          </button>
          <button type="button" className="btn btn--danger btn--block" onClick={onConfirm}>
            Leave
          </button>
        </div>
      </div>
    </div>
  )
}
