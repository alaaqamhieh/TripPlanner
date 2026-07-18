import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Local-first trip site. No backend, no external calls.
export default defineConfig({
  plugins: [react()],
  base: './',
})
