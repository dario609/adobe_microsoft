import express from 'express'
import cors from 'cors'
import { API_PREFIX } from './config.js'
import { createApiRouter } from './routes/index.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: true }))
  app.use(express.json())
  app.use(API_PREFIX, createApiRouter())

  return app
}
