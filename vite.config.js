import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Roam Bites',
        short_name: 'RoamBites',
        description: 'Order lunch ahead, skip the cafeteria line.',
        theme_color: '#F2761E',
        background_color: '#FAF7F2',
        display: 'standalone',
        start_url: '/login',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache the app shell so it loads instantly on repeat visits.
        // Live data (menu, orders) still comes from Supabase over the network as normal —
        // this only caches static files, not your database content.
        globPatterns: ['**/*.{js,css,html,png,webp,svg}'],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          lottie: ['lottie-web'],
        },
      },
    },
  },
})
