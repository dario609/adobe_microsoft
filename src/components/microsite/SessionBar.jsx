import { formatClock } from '../../utils/time.js'

export function SessionBar({ remainingSeconds, onFinish, uploadBusy }) {
  return (
    <div className="microsite__sessionBar" role="status" aria-live="polite">
      <div className="microsite__timer">
        <span className="microsite__timerLabel">Time remaining</span>
        <span className="microsite__timerValue">{formatClock(remainingSeconds)}</span>
      </div>
      <div className="microsite__sessionActions">
        <button
          type="button"
          className="microsite__btn microsite__btn--secondary"
          onClick={onFinish}
          disabled={uploadBusy}
        >
          Finish
        </button>
      </div>
    </div>
  )
}
