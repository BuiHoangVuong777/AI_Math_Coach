import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// The AI coach backend (server/index.ts). Only /api is proxied; no server-side
// variable (e.g. OPENAI_API_KEY) is ever exposed to the client bundle — Vite
// only exposes variables prefixed with VITE_, and none are used.
const coachServer = `http://127.0.0.1:${process.env.COACH_SERVER_PORT || 8787}`
const proxy = { '/api': { target: coachServer, changeOrigin: false } }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: { proxy },
  preview: { proxy },
})
