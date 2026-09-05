import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  // Shared static assets: public (logo, favicon, OG images)
  publicDir: path.resolve(__dirname, '..', 'public'),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Deduplicate React to prevent multiple instances
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/healthz': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
})
