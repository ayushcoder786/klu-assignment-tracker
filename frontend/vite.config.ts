import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Use injectManifest so we can write a custom service worker with push event handling.
      // The custom SW file (src/sw.ts) imports workbox precaching + adds our push notification handler.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        name: 'KLU Assignment Tracker',
        short_name: 'KLU Tracker',
        description: 'Track your KLU university assignments in one place.',
        theme_color: '#1e1b4b',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        categories: ['education', 'productivity'],
        shortcuts: [
          {
            name: 'My Assignments',
            short_name: 'Assignments',
            description: 'View all assignments',
            url: '/assignments',
            icons: [{ src: 'icons/pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'View dashboard',
            url: '/dashboard',
            icons: [{ src: 'icons/pwa-192x192.png', sizes: '192x192' }],
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  server: {
    proxy: {
      // Forward all /api/* requests to the Spring Boot backend during dev
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
})
