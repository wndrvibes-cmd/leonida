import { useEffect } from 'react'
import { publicUrl } from '@/lib/supabase'
import { useAuth } from '@/app/AuthProvider'

/**
 * Fond personnalise du membre.
 *
 * Pose `data-user-bg="true"` sur <html> et alimente les variables lues par
 * `global.css` (`body::before` pour l'image, `body::after` pour le voile).
 * A monter UNE SEULE FOIS, haut dans l'arbre.
 *
 * Le fond est retire des que le membre se deconnecte, desactive l'option ou
 * supprime son image : la fonction de nettoyage de l'effet s'en charge, y
 * compris au demontage.
 */

const CSS_VARIABLES = [
  '--user-bg-image',
  '--user-bg-position',
  '--user-bg-scale',
  '--user-bg-dim',
] as const

/**
 * Positions acceptees : mots-cles CSS, pourcentages et longueurs simples.
 * `background_position` est un champ texte libre en base ; une valeur exotique
 * rendrait la declaration invalide et casserait le cadrage, on la refuse.
 */
const SAFE_POSITION = /^[a-z0-9%\s.-]{1,40}$/i

/**
 * L'URL est injectee dans `url("...")`. On n'accepte donc que du http(s) sans
 * guillemet, parenthese, antislash ni espace : impossible de sortir de la
 * fonction `url()` et de detourner la declaration CSS.
 */
function isSafeBackgroundUrl(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return false
  return !/["'()\\\s]/.test(url)
}

function clamp(value: number | null | undefined, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(Math.max(value, min), max)
}

function clearBackground(root: HTMLElement): void {
  delete root.dataset.userBg
  for (const name of CSS_VARIABLES) root.style.removeProperty(name)
}

export function useAppBackground(): void {
  const { session, settings } = useAuth()

  const enabled = Boolean(session) && (settings?.background_enabled ?? false)
  const path = settings?.background_url ?? null
  const position = settings?.background_position ?? 'center'
  const scale = settings?.background_scale
  const dim = settings?.background_dim

  useEffect(() => {
    const root = document.documentElement

    if (!enabled || !path) {
      clearBackground(root)
      return
    }

    const url = publicUrl('backgrounds', path)
    if (!url || !isSafeBackgroundUrl(url)) {
      clearBackground(root)
      return
    }

    root.dataset.userBg = 'true'
    root.style.setProperty('--user-bg-image', `url("${url}")`)
    root.style.setProperty(
      '--user-bg-position',
      SAFE_POSITION.test(position) ? position : 'center',
    )
    root.style.setProperty('--user-bg-scale', String(clamp(scale, 1, 3, 1)))
    root.style.setProperty('--user-bg-dim', String(clamp(dim, 0, 1, 0.55)))

    return () => clearBackground(root)
  }, [enabled, path, position, scale, dim])
}
