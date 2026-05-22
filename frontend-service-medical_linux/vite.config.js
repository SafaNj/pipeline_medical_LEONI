import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: {},
  },
  resolve: {
    alias: {
      stream: fileURLToPath(new URL('./src/shims/stream-browser-empty.js', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    // Dev : le navigateur appelle http://localhost:5173/api/... → Vite transmet à Django (évite CORS).
    // Prod : définir VITE_API_BASE_URL (ou VITE_API_URL) vers l’URL absolue du backend si l’app n’est pas servie derrière le même domaine.
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
