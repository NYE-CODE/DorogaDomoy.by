import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
    server: {
        port: 3000,
        open: true,
        watch: {
            // SQLite writes from FastAPI should not trigger Vite full reloads.
            ignored: ['**/backend/**', '**\\backend\\**', '**/*.db', '**/*.db-*'],
        },
    },
});
