/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// La API se sirve bajo /api en el mismo origen (proxy en desarrollo, servidor web en producción),
// lo que permite cookies SameSite=Strict y evita configurar CORS.
const apiTarget = process.env.ACADEMY_API_URL ?? 'http://localhost:5080'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Aspire asigna el puerto mediante PORT; sin Aspire se usa el 5173 habitual.
    port: Number(process.env.PORT) || 5173,
    strictPort: true,
    proxy: {
      '/api': { target: apiTarget, changeOrigin: false },
    },
  },
  build: {
    // El fragmento más grande es la escena 3D (three.js), que se descarga bajo demanda solo en
    // equipos con WebGL que no piden reducir el movimiento ni ahorrar datos.
    chunkSizeWarningLimit: 600,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    testTimeout: 20_000,
  },
})
