/// <reference types="vite/client" />

/**
 * Variables d'environnement reellement lues par le front-end.
 * Aucune cle secrete ici : seules les valeurs publiables sont exposees au navigateur.
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
