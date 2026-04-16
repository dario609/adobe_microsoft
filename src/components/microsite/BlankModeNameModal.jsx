/**
 * Blank Mode Name Modal - Simplified version for direct blank canvas workflow
 * Collects user's pickup name before launching editor
 */
export function BlankModeNameModal({ isOpen, name, onNameChange, onConfirm, onCancel, error }) {
  if (!isOpen) return null

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && name.trim()) {
      onConfirm?.()
    } else if (e.key === 'Escape') {
      onCancel?.()
    }
  }

  return (
    <div className="modal modal--overlay" role="dialog" aria-modal="true" aria-labelledby="blankNameModalTitle">
      <div className="modal__content modal__content--sm">
        <div className="modal__header">
          <h2 id="blankNameModalTitle" className="modal__title">
            What's your name?
          </h2>
          <p className="modal__description">
            We'll use this to label your design when you finish.
          </p>
        </div>

        <div className="modal__body">
          {error ? (
            <div className="modal__error">
              <p>{error}</p>
            </div>
          ) : null}

          <input
            type="text"
            className="modal__input"
            placeholder="Your name"
            value={name}
            onChange={(e) => onNameChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            maxLength={50}
          />
          <p className="modal__hint">
            {name.length}/50 characters
          </p>
        </div>

        <div className="modal__footer">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={onConfirm}
            disabled={!name.trim()}
          >
            Start
          </button>
        </div>
      </div>
    </div>
  )
}
