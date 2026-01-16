import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000, // Cambia aquí al puerto que prefieras (ej: 3000, 4000, 8080)
    // Proxy para evitar CORS en desarrollo: redirige /api al backend online
    proxy: {
      '/api': {
        target: 'https://sirona-api.ecuconsult.net',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
