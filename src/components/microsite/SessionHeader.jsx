import { formatClock } from '../../utils/time.js'
import { ExperienceLogoImg } from './ExperienceLogoImg.jsx'
import { HeaderBanner } from './HeaderBanner.jsx'

export function SessionHeader({
  remainingSeconds,
  showTimer,
  onFinish,
  onLeave,
  uploadBusy,
  bannerCacheKey = 0,
}) {
  const low = showTimer && remainingSeconds <= 120

  return (
    <header className="sessionHeader" role="banner">
      <div className="sessionHeader__brandRow">
        <ExperienceLogoImg className="sessionHeader__logo" width={44} height={44} />
        <HeaderBanner cacheKey={bannerCacheKey} />
      </div>
      <div className="sessionHeader__actions">
        <button
          type="button"
          className="sessionHeader__leave"
          onClick={onLeave}
          disabled={uploadBusy}
        >
          Leave
        </button>
        {showTimer ? (
          <div
            className={`sessionHeader__timerBox${low ? ' sessionHeader__timerBox--low' : ''}`}
            role="status"
            aria-live="polite"
          >
            <svg
              className="sessionHeader__timerIcon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                fill="currentColor"
                d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"
              />
            </svg>
            <span className="sessionHeader__timerPill">{formatClock(remainingSeconds)}</span>
          </div>
        ) : null}
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
