import { defineConfig } from 'vite'

export default defineConfig({
  base: '/typing-speed-classic/',  // ← This fixes GitHub Pages paths!
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})