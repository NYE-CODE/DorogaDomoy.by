import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    emptyOutDir: true,
  },
  plugins: [
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
