import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    proxy: {
      '/api': process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000',
      '/sanctum': process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          const path = id.replaceAll('\\', '/')
          if (/node_modules\/(react|react-dom|scheduler)\//.test(path)) return 'vendor-react'
          if (path.includes('react-router')) return 'vendor-router'
          // Keep animation code inside the lazy feature chunks that use it.
          // A shared motion chunk pulls its JSX runtime into the entry graph and
          // makes every route pay the parsing cost before first paint.
          if (path.includes('react-helmet')) return 'vendor-seo'
          if (path.includes('i18next')) return 'vendor-i18n'
          // API-heavy screens are lazy; keeping Axios out of a forced shared
          // chunk prevents it from being preloaded by the public landing page.
          if (path.includes('lucide-react') || path.includes('react-icons')) return 'vendor-icons'
          return undefined
        },
      },
    },
  },
})
