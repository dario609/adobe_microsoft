export function SubmissionThanksModal({ message, onDismiss }) {
  return (
    <div className="modalRoot modalRoot--confirm" role="dialog" aria-modal="true" aria-labelledby="thanks-title">
      <button type="button" className="modalRoot__scrim" aria-label="Dismiss" onClick={onDismiss} />
      <div className="modalCard modalCard--confirm">
        <h2 id="thanks-title" className="modalCard__title">
          Submission received
        </h2>
        <p className="modalCard__hint modalCard__hint--lead">{message}</p>
        <div className="modalCard__row modalCard__row--stack">
          <button type="button" className="btn btn--primary btn--block" onClick={onDismiss}>
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
