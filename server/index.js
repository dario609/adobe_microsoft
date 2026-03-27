import './env.js'
import { createApp } from './app.js'
import { API_PREFIX, DEFAULT_PORT, OAUTH_DROPBOX_START } from './config.js'

const port = Number(process.env.PORT) || DEFAULT_PORT
const app = createApp()

// Render (and most PaaS) require binding to 0.0.0.0 so the platform can route traffic.
const host = process.env.HOST || '0.0.0.0'

app.listen(port, host, () => {
  console.log(`Upload API http://${host}:${port}`)
  console.log(`Dropbox OAuth (one-time) http://${host}:${port}${OAUTH_DROPBOX_START}`)
  console.log(`Public config GET http://${host}:${port}/api/config`)
  console.log(`Gallery GET/POST ${API_PREFIX}/gallery · GET ${API_PREFIX}/gallery/image/:id`)
})
