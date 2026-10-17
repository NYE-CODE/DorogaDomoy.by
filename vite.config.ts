import path from 'path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/** В dev/preview Vite не отдаёт каталог `public/.../index.html` по пути без файла.
 *  На проде nginx делает это через `try_files $uri $uri/ /index.html`. */
function guidePageDevFallback(): Plugin {
  const rewrite = (req: { url?: string }) => {
    const raw = req.url ?? ''
    const pathOnly = raw.split('?')[0]
    if (pathOnly !== '/poisk-propavshih-zhivotnyh' && pathOnly !== '/poisk-propavshih-zhivotnyh/') return
    const query = raw.includes('?') ? `?${raw.split('?')[1]}` : ''
    req.url = `/poisk-propavshih-zhivotnyh/index.html${query}`
  }
  return {
    name: 'guide-page-dev-fallback',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req)
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req)
        next()
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    emptyOutDir: true,
  },
  plugins: [
    guidePageDevFallback(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    watch: {
      // On Windows, backend writes to SQLite WAL/SHM files can surface with either
      // slash style and trigger a full-page reload in Vite during Telegram linking.
      ignored: ['**/backend/**', '**\\backend\\**', '**/*.db', '**/*.db-*'],
    },
  },
})
