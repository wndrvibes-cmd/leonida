import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  /*
   * GitHub Pages sert le site depuis /<nom-du-depot>/, pas depuis la racine.
   * Sans ce prefixe, tous les fichiers JS et CSS seraient demandes a la
   * racine du domaine et la page resterait blanche.
   * En developpement, `base` reste '/' : d'ou la lecture de la variable.
   */
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: { port: 5173, host: true },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          motion: ['framer-motion'],
        },
      },
    },
  },
})
