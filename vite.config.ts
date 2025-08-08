// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      // pour l’émotion css-in-js 
      jsxImportSource: '@emotion/react',
    }),
  ],
  resolve: {
    // évite les doublons d’Emotion
    dedupe: [
      '@emotion/react',
      '@emotion/styled',
    ],
  },
    optimizeDeps: {
    include: ['@mui/material', '@emotion/react', '@emotion/styled'],
  },
})
