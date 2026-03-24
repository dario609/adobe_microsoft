import './env.js'
import { createApp } from './app.js'
import { DEFAULT_PORT, OAUTH_DROPBOX_START } from './config.js'

const port = Number(process.env.PORT) || DEFAULT_PORT
const app = createApp()

app.listen(port, '127.0.0.1', () => {
  console.log(`Upload API http://127.0.0.1:${port}`)
  console.log(`Dropbox OAuth (one-time) http://127.0.0.1:${port}${OAUTH_DROPBOX_START}`)
})
