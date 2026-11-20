import { useCallback, useState } from 'react'
import { supabase, readableError } from '@/lib/supabase'

/**
 * Actions d'authentification Supabase.
 *
 * Aucune simulation : chaque fonction appelle reellement supabase.auth.
 * Si la confirmation d'e-mail est activee dans le tableau de bord Supabase,
 * `signUp` renvoie `needsEmailConfirmation: true` et l'interface doit le dire
 * clairement plutot que de pretendre que le compte est pret.
 */
export function useAuthActions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true)
    setError(null)
    try {
      return await fn()
    } catch (e) {
      setError(readableError(e))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const signUp = useCallback(
    (email: string, password: string, username: string) =>
      run(async () => {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Repris par le declencheur handle_new_user pour creer le profil.
            data: { username },
            emailRedirectTo: `${window.location.origin}/connexion`,
          },
        })
        if (err) throw err

        // Pas de session renvoyee => Supabase attend une confirmation par e-mail.
        return {
          user: data.user,
          needsEmailConfirmation: !data.session,
        }
      }),
    [run],
  )

  const signIn = useCallback(
    (email: string, password: string) =>
      run(async () => {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
        return data
      }),
    [run],
  )

  const requestPasswordReset = useCallback(
    (email: string) =>
      run(async () => {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reinitialiser`,
        })
        if (err) throw err
        return true
      }),
    [run],
  )

  const updatePassword = useCallback(
    (password: string) =>
      run(async () => {
        const { error: err } = await supabase.auth.updateUser({ password })
        if (err) throw err
        return true
      }),
    [run],
  )

  return { loading, error, setError, signUp, signIn, requestPasswordReset, updatePassword }
}

/* ------------------------------------------------------------- validation */

export interface FieldErrors {
  [field: string]: string | undefined
}

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Indiquez votre adresse e-mail.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return "Cette adresse e-mail n'est pas valide."
  return undefined
}

/** Les regles doivent rester alignees sur la contrainte CHECK de `profiles`. */
export function validateUsername(username: string): string | undefined {
  if (!username.trim()) return 'Choisissez un pseudo.'
  if (username.length < 3) return 'Le pseudo doit contenir au moins 3 caracteres.'
  if (username.length > 24) return 'Le pseudo ne peut pas depasser 24 caracteres.'
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Le pseudo ne peut contenir que des lettres, des chiffres et des underscores.'
  }
  return undefined
}

export function validatePassword(password: string): string | undefined {
  if (!password) return 'Choisissez un mot de passe.'
  if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caracteres.'
  return undefined
}

/** Indicateur de robustesse affiche a l'inscription (0 a 4). */
export function passwordStrength(password: string): { score: number; label: string } {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++

  const labels = ['Tres faible', 'Faible', 'Correct', 'Bon', 'Excellent']
  return { score, label: labels[score] ?? labels[0] }
}

/** Verifie la disponibilite d'un pseudo avant l'envoi du formulaire. */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('username', username)

  // En cas d'erreur reseau on n'empeche pas la soumission : la contrainte
  // d'unicite en base reste la verification faisant autorite.
  if (error) return true
  return (count ?? 0) === 0
}
