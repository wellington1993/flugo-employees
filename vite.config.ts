import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: process.env.BASE_URL || '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['vite.svg', 'apple-touch-icon.png', 'maskable-icon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,webmanifest,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/__/],
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'script' || request.destination === 'style' || request.destination === 'worker',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'assets-cache',
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 7 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image' || request.destination === 'font',
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Flugo Staff Manager',
        short_name: 'Flugo Staff',
        description: 'Gerenciador de colaboradores offline-first',
        theme_color: '#1976d2',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 5173,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      '@emotion/react': path.resolve(__dirname, 'node_modules/@emotion/react'),
      '@emotion/styled': path.resolve(__dirname, 'node_modules/@emotion/styled'),
    },
  },
  define: {
    'process.env': {}
  }
})
