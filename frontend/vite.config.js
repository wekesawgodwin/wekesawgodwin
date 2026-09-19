import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development the FastAPI backend runs on :8000; proxy API calls (and the
// backend-generated sitemap/robots) so the browser sees a single origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/sitemap.xml': 'http://localhost:8000',
      '/robots.txt': 'http://localhost:8000',
    },
  },
})
