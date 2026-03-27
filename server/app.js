import express from 'express'
import cors from 'cors'
import { API_PREFIX } from './config.js'
import { createApiRouter } from './routes/index.js'

export function createApp() {
  const app = express()

  // Explicit headers so Safari (incl. iPad) preflight succeeds for auth + API calls.
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Site-Token', 'X-Requested-With'],
    })
  )
  app.use(express.json())
  app.use(API_PREFIX, createApiRouter())

  return app
}
