import confetti from 'canvas-confetti'
import { useEffect } from 'react'

const CONFETTI_COLORS = ['#2563eb', '#22c55e', '#eab308', '#f97316', '#a855f7', '#ec4899', '#38bdf8']

/** Avoid double bursts in React Strict Mode (effect runs twice in dev). */
let lastThanksConfettiAt = 0

function runThanksConfetti() {
  const now = Date.now()
  if (now - lastThanksConfettiAt < 900) {
    return () => {}
  }
  lastThanksConfettiAt = now

  const burst = (opts) =>
    confetti({
      disableForReducedMotion: true,
      colors: CONFETTI_COLORS,
      zIndex: 135,
      ...opts,
    })

  burst({
    particleCount: 110,
    spread: 72,
    origin: { x: 0.5, y: 0.32 },
    startVelocity: 42,
    gravity: 1.05,
    ticks: 280,
  })

  const t1 = window.setTimeout(() => {
    burst({ particleCount: 50, angle: 58, spread: 58, origin: { x: 0.06, y: 0.58 }, startVelocity: 38 })
    burst({ particleCount: 50, angle: 122, spread: 58, origin: { x: 0.94, y: 0.58 }, startVelocity: 38 })
  }, 160)

  const t2 = window.setTimeout(() => {
    burst({
      particleCount: 40,
      spread: 100,
      origin: { x: 0.5, y: 0.48 },
      startVelocity: 28,
      gravity: 0.95,
      scalar: 0.85,
      ticks: 220,
    })
  }, 420)

  return () => {
    window.clearTimeout(t1)
    window.clearTimeout(t2)
  }
}

export function SubmissionThanksModal({ message, onDismiss }) {
  useEffect(() => {
    return runThanksConfetti()
  }, [])

  return (
    <div
      className="modalRoot modalRoot--confirm modalRoot--thanks"
      role="dialog"
      aria-modal="true"
      aria-labelledby="thanks-title"
    >
      <button type="button" className="modalRoot__scrim" aria-label="Dismiss" onClick={onDismiss} />
      <div className="modalCard modalCard--confirm modalCard--thanks">
        <div className="modalCard__thanksBadge" aria-hidden>
          <svg className="modalCard__thanksBadgeSvg" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="22" className="modalCard__thanksBadgeCircle" />
            <path
              d="M15 24.5l6 6L33 18"
              stroke="white"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 id="thanks-title" className="modalCard__title modalCard__title--thanks">
          Submission received
        </h2>
        <p className="modalCard__hint modalCard__hint--lead modalCard__hint--thanks">{message}</p>
        <div className="modalCard__row modalCard__row--stack">
          <button type="button" className="btn btn--primary btn--block" onClick={onDismiss}>
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
