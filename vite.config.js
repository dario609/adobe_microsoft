import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

import dns from 'node:dns'

dns.setDefaultResultOrder('verbatim')
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    https: true,
  },
})
