import { formatClock } from '../../utils/time.js'

export function SessionHeader({ brandName, remainingSeconds, onFinish, onLeave, uploadBusy }) {
  const low = remainingSeconds <= 120

  return (
    <header className="sessionHeader" role="banner">
      <div className="sessionHeader__left">
        <span className="sessionHeader__brand">{brandName}</span>
        <button
          type="button"
          className="sessionHeader__leave"
          onClick={onLeave}
          disabled={uploadBusy}
        >
          Leave
        </button>
      </div>
      <div className="sessionHeader__corner" role="status" aria-live="polite">
        <div className={`sessionHeader__timer${low ? ' sessionHeader__timer--low' : ''}`}>
          <span className="sessionHeader__timerLabel">Time</span>
          <span className="sessionHeader__timerValue">{formatClock(remainingSeconds)}</span>
        </div>
        <button
          type="button"
          className="sessionHeader__finish"
          onClick={onFinish}
          disabled={uploadBusy}
        >
          Finish
        </button>
      </div>
    </header>
  )
}
