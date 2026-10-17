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

/** В dev проксируем ботов (Telegram и т.п.) на бэкенд — OG HTML для /pet и /city. */
function seoBotProxy(): Plugin {
  const BOT_UA =
    /TelegramBot|facebookexternalhit|Twitterbot|Slackbot|Discordbot|LinkedInBot|WhatsApp|Viber|Googlebot|YandexBot|bingbot|Applebot|Preview/i
  const SEO_PATH = /^\/(pet|shelter-pet|city)\/[^/]+\/?$/
  const apiOrigin = (process.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')

  const middleware = async (
    req: { url?: string; headers?: { 'user-agent'?: string } },
    res: { writableEnded?: boolean; statusCode: number; setHeader: (k: string, v: string) => void; end: (b: string) => void },
    next: () => void,
  ) => {
    const pathOnly = (req.url ?? '').split('?')[0]
    const ua = req.headers?.['user-agent'] ?? ''
    if (!SEO_PATH.test(pathOnly) || !BOT_UA.test(ua)) {
      next()
      return
    }
    try {
      const upstream = await fetch(`${apiOrigin}${req.url ?? pathOnly}`)
      const body = await upstream.text()
      res.statusCode = upstream.status
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'text/html; charset=utf-8')
      res.end(body)
    } catch {
      next()
    }
  }

  return {
    name: 'seo-bot-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        void middleware(req, res, next)
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
    seoBotProxy(),
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
