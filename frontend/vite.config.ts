import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import fs from 'fs'

// HTTPS Configuration
// To enable HTTPS for mobile microphone access:
// 1. Install mkcert: choco install mkcert
// 2. Run: mkcert -install
// 3. Run: mkcert -key-file .cert/key.pem -cert-file .cert/cert.pem localhost 192.168.1.11
// 4. Uncomment the https block below

const httpsConfig = fs.existsSync('./.cert/key.pem') && fs.existsSync('./.cert/cert.pem')
  ? {
      key: fs.readFileSync('./.cert/key.pem'),
      cert: fs.readFileSync('./.cert/cert.pem')
    }
  : undefined

export default defineConfig({
  base: '/MindMate/', // GitHub Pages base URL
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'MindMate - Voice-First Mental Wellness',
        short_name: 'MindMate',
        description: 'A privacy-first, voice-driven companion for daily emotional check-ins',
        theme_color: '#ff6b6b',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/MindMate/',
        scope: '/MindMate/',
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
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['health', 'lifestyle', 'productivity'],
        screenshots: [
          {
            src: 'screenshot-wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide'
          },
          {
            src: 'screenshot-narrow.png',
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.mindmate\.app\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 300 // 5 minutes
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0', // Listen on all network interfaces (allows 192.168.1.11 access)
    https: httpsConfig, // Auto-enables HTTPS if certificates exist
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          animation: ['framer-motion'],
        },
      },
    },
  },
})