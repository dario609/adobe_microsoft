import rateLimit from 'express-rate-limit'

const perMin = Number(process.env.UPLOAD_RATE_LIMIT_PER_MINUTE || 120)
const max = Number.isFinite(perMin) && perMin > 0 ? Math.min(perMin, 10000) : 120

export const uploadRateLimiter = rateLimit({
  windowMs: 60000,
  max,
  message: {
    error: 'Too many uploads. Please wait a moment and try again.',
    code: 'UPLOAD_RATE_LIMIT',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.LOAD_TEST_UPLOAD_NOOP === 'true',
})
