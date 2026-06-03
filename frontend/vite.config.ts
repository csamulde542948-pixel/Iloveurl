import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(source) {
      if (source.startsWith('../../imports/')) {
        return path.resolve(__dirname, 'src/imports', source.replace('../../imports/', ''))
      }
      return null
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    figmaAssetResolver(),
    nodePolyfills({
      include: [
        'buffer',
        'process',
        'util',
        'stream',
        'events',
        'path',
        'assert',
        'crypto',
        'http',
        'https',
        'os',
        'url',
        'zlib'
      ],
      protocolImports: true,
    }),
  ],

  server: {
    allowedHosts: [
      'shindig-chuck-vowel.ngrok-free.dev',
      '.ngrok-free.dev'
    ],
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  define: {
    global: 'globalThis',
  },

  assetsInclude: ['**/*.svg', '**/*.csv'],
})