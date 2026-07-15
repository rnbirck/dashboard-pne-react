import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'dev-ui',
  publicDir: false,
  plugins: [react()],
  server: {
    port: 5174,
  },
  preview: {
    port: 4174,
  },
  build: {
    emptyOutDir: true,
    outDir: '../artifacts/dev-ui-build',
  },
})
