import { useEffect, useSyncExternalStore } from 'react'
import { useAuth } from '@/app/AuthProvider'

/**
 * Preference de mouvement, partagee par toute l'application.
 *
 * Deux sources se combinent :
 *   1. `prefers-reduced-motion` du systeme ;
 *   2. le reglage membre `user_settings.reduce_motion`.
 *
 * Le resultat est pose sur <html data-reduce-motion="true">, ce qui met toutes
 * les durees de tokens.css a 0ms. Les composants qui animent en JavaScript
 * (framer-motion) lisent la valeur via `useReduceMotion()`.
 */

const listeners = new Set<() => void>()

const mql = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : null

let systemPref = mql?.matches ?? false
let memberPref = false
let snapshot = systemPref

function apply(): void {
  const next = systemPref || memberPref
  if (next === snapshot) return
  snapshot = next
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.reduceMotion = next ? 'true' : 'false'
  }
  for (const listener of listeners) listener()
}

if (typeof document !== 'undefined') {
  document.documentElement.dataset.reduceMotion = snapshot ? 'true' : 'false'
}

mql?.addEventListener('change', (event) => {
  systemPref = event.matches
  apply()
})

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

function getSnapshot(): boolean {
  return snapshot
}

/** `true` si l'interface doit renoncer aux animations. */
export function useReduceMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/**
 * A appeler une seule fois, haut dans l'arbre : synchronise le reglage membre
 * avec l'attribut <html data-reduce-motion>.
 */
export function useMotionPreference(): void {
  const { settings } = useAuth()
  const member = settings?.reduce_motion ?? false

  useEffect(() => {
    memberPref = member
    apply()
  }, [member])
}
