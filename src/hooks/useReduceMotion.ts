/**
 * Preference de mouvement : combine `prefers-reduced-motion` du systeme et le
 * reglage membre `user_settings.reduce_motion`, et pose
 * `data-reduce-motion` sur <html> (ce qui met les durees de tokens.css a 0).
 *
 * Re-export de la source unique : le magasin est un singleton de module, le
 * dupliquer ferait coexister deux etats contradictoires sur le meme attribut.
 *
 *   - `useReduceMotion()`     : lecture, dans n'importe quel composant ;
 *   - `useMotionPreference()` : synchronisation, UNE SEULE FOIS dans le routeur.
 */
export { useMotionPreference, useReduceMotion } from '@/app/motionPreference'
