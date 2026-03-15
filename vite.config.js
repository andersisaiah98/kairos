import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/esv-api': {
        target: 'https://api.esv.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/esv-api/, ''),
        secure: true,
      },
    },
  },
})
