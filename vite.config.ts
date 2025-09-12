// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Pourquoi ces réglages ?
 * - plugin React + Babel '@emotion' : améliore l'XP avec Emotion (labels, source maps),
 *   sans utiliser jsxImportSource (qui peut dupliquer Emotion).
 * - resolve.dedupe : garantit UNE seule instance d'Emotion (évite "styled_default is not a function").
 * - optimizeDeps.include :
 *     * on force le pré-bundle d'Emotion (toujours bien)
 *     * on pré-bundle aussi MUI (material/system) pour stabiliser les exports
 *       (c’est la rustine la plus sûre après ton bug).
 *   ⚠️ NE PAS inclure '@mui/base' ici, sauf si c’est une dépendance directe (ce n’est pas ton cas).
 */
export default defineConfig({
  plugins: [
    react({
      babel: { plugins: ['@emotion'] } // pas de jsxImportSource ici
    })
  ],
  resolve: {
    dedupe: ['@emotion/react', '@emotion/styled']
  },
  optimizeDeps: {
    include: [
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/system'
      // NE PAS mettre '@mui/base' : non résoluble à la racine si non dépendance directe.
    ]
    // Pas de "exclude" ici : on laisse Vite gérer le reste.
  }
})
