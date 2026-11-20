import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Client Supabase unique pour toute l'application.
 *
 * SECURITE — ce qui est expose ici l'est AU NAVIGATEUR :
 *   - on n'utilise QUE la cle publiable (`sb_publishable_...`) ;
 *   - la cle `service_role` n'apparait jamais dans le front-end, elle est
 *     reservee aux Edge Functions (voir supabase/functions/) ;
 *   - toute la protection des donnees repose sur la RLS cote base, jamais sur
 *     un controle fait en JavaScript.
 */

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error(
    "Configuration Supabase manquante. Copiez .env.example vers .env.local " +
      'et renseignez VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY.',
  )
}

// Garde-fou : une cle secrete ne doit jamais se retrouver cote client.
if (key.startsWith('sb_secret_') || key.includes('service_role')) {
  throw new Error(
    'Cle Supabase invalide : une cle secrete / service_role a ete placee dans ' +
      'le front-end. Utilisez la cle publiable.',
  )
}

export const supabase = createClient<Database>(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'leonida.auth',
  },
  global: {
    headers: { 'x-application-name': 'leonida' },
  },
})

/** URL publique d'un fichier stocke dans un bucket Supabase Storage. */
export function publicUrl(bucket: string, path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

/** Traduit une erreur Supabase en message lisible en francais. */
export function readableError(error: unknown): string {
  if (!error) return 'Une erreur inconnue est survenue.'
  const message = typeof error === 'string' ? error : (error as { message?: string }).message ?? ''
  const code = (error as { code?: string }).code

  if (code === '23505') return 'Cet element existe deja.'
  if (code === '23514') return 'Les informations saisies ne respectent pas le format attendu.'
  if (code === '42501' || /row-level security/i.test(message)) {
    return "Vous n'avez pas les droits necessaires pour cette action."
  }
  if (/Invalid login credentials/i.test(message)) return 'Adresse e-mail ou mot de passe incorrect.'
  if (/Email not confirmed/i.test(message)) return "Votre adresse e-mail n'a pas encore ete confirmee."
  if (/User already registered/i.test(message)) return 'Un compte existe deja avec cette adresse.'
  if (/Password should be at least/i.test(message)) {
    return 'Le mot de passe doit contenir au moins 8 caracteres.'
  }
  if (/rate limit|too many requests/i.test(message)) {
    return 'Trop de tentatives. Patientez quelques instants.'
  }
  if (/Failed to fetch|NetworkError/i.test(message)) {
    return 'Connexion impossible. Verifiez votre reseau.'
  }
  if (/exceeded the maximum allowed size/i.test(message)) {
    return 'Ce fichier depasse la taille autorisee.'
  }
  if (/mime type .* is not supported/i.test(message)) {
    return "Ce format de fichier n'est pas accepte."
  }
  return message || 'Une erreur est survenue.'
}
