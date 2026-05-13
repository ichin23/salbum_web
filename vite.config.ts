import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente baseadas no modo atual (ex: development, production)
  const env = loadEnv(mode, process.cwd(), '')
  const API_TARGET = env.VITE_API_BASE_URL || 'http://localhost:8080'

  return {
    plugins: [
      vue(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          runtimeCaching: [
            {
              urlPattern: /^\/api\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 24 * 60 * 60 // 24 hours
                },
                networkTimeoutSeconds: 5
              }
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
                }
              }
            }
          ]
        },
        manifest: {
          id: '/app',
          name: 'Salbum',
          short_name: 'Salbum',
          description: 'Music sharing and review application',
          theme_color: '#234ED8',
          background_color: '#234ED8',
          display: 'standalone',
          start_url: '/?utm_source=pwa',
          scope: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ],
          shortcuts: [
            {
              name: 'Open Salbum',
              short_name: 'Salbum',
              url: '/',
              icons: [
                {
                  src: 'pwa-192x192.png',
                  sizes: '192x192',
                  type: 'image/png',
                  purpose: 'maskable'
                }
              ]
            }
          ],
          screenshots: [
            {
              src: 'home_screen.png',
              sizes: '632x1280',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Salbum Home'
            },
            {
              src: 'album_screen.png',
              sizes: '632x1280',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Salbum Album Details'
            },
            {
              src: 'profile_screen.png',
              sizes: '632x1280',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Salbum Profile Screen'
            }
          ]
        }
      })
    ],
    css: {
      postcss: {
        plugins: [
          tailwindcss(),
          autoprefixer(),
        ],
      },
    },
    server: {
      proxy: {
        '/api': {
          target: API_TARGET,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          cookieDomainRewrite: 'localhost',
          cookiePathRewrite: '/',
        },
      },
    },
  }
})
