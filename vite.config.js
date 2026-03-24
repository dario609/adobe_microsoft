import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

import dns from 'node:dns'

dns.setDefaultResultOrder('verbatim')
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    // `true` = listen on all interfaces so phones/tablets on the same Wi‑Fi can open https://<your-lan-ip>:5173
    // Use host: '127.0.0.1' if you only want local machine access.
    host: true,
    port: 5173,
    strictPort: true,
    https: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
})
