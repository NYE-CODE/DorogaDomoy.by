import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': '/',
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
