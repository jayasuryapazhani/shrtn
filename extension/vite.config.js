import {
  dirname,
  resolve,
} from 'node:path'

import {
  fileURLToPath,
} from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const projectDirectory = dirname(
  fileURLToPath(import.meta.url),
)

export default defineConfig({
  plugins: [react()],

  base: './',

  build: {
    rolldownOptions: {
      input: {
        popup: resolve(
          projectDirectory,
          'index.html',
        ),

        background: resolve(
          projectDirectory,
          'src/background/serviceWorker.js',
        ),
      },

      output: {
        entryFileNames(chunkInfo) {
          if (chunkInfo.name === 'background') {
            return 'background.js'
          }

          return 'assets/[name]-[hash].js'
        },

        chunkFileNames:
          'assets/[name]-[hash].js',

        assetFileNames:
          'assets/[name]-[hash][extname]',
      },
    },
  },
})