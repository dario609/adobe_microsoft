import express from 'express'
import cors from 'cors'
import { API_PREFIX } from './config.js'
import { createApiRouter } from './routes/index.js'

export function createApp() {
  const app = express()

  if (['1', 'true', 'yes', 'on'].includes(String(process.env.TRUST_PROXY || '').trim().toLowerCase())) {
    app.set('trust proxy', 1)
  }

  // Explicit headers so Safari (incl. iPad) preflight succeeds for auth + API calls.
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Site-Token',
        'X-Admin-Token',
        'X-Requested-With',
        'Idempotency-Key',
      ],
    })
  )
  app.use(express.json())
  app.use(API_PREFIX, createApiRouter())

  return app
}
