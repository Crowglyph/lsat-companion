import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    target: ['es2020', 'safari15'],
  },
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Lex — LSAT Companion',
        short_name: 'Lex',
        description: 'A tiny capybara who studies LSAT with you',
        theme_color: '#8b6c5b',
        background_color: '#1c1410',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Note: drills.json (~14 MB) intentionally NOT in precache — fetched
        // on demand and cached via runtimeCaching below.
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // The drills file is large; raise the runtime-cache size cap.
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname === '/drills.json',
            handler: 'CacheFirst',
            options: {
              cacheName: 'lex-drills',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 90 * 24 * 60 * 60,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
