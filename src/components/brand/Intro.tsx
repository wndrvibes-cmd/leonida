import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/app/AuthProvider'
import { useReduceMotion } from '@/app/motionPreference'
import { supabase } from '@/lib/supabase'
import { Logo } from '@/components/layout/Logo'
import s from './Intro.module.css'

/** Marqueur de session pour les visiteurs non connectes. */
const SESSION_KEY = 'leonida.intro.vue'

/**
 * `checking` : la session n'est pas encore resolue, on couvre l'ecran sans animer.
 * `playing`  : l'animation se joue.
 * `closing`  : fondu de sortie.
 * `done`     : plus rien n'est rendu.
 */
type Phase = 'checking' | 'playing' | 'closing' | 'done'

/** Duree de l'animation, puis du fondu. Total maximum : 2,3s. */
const PLAY_MS = 2000
const PLAY_MS_REDUCED = 600
const CLOSE_MS = 300

function sessionSeen(): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    // Navigation privee : on considere que l'intro n'a pas ete vue.
    return false
  }
}

function markSessionSeen(): void {
  try {
    window.sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    // Stockage indisponible : sans consequence, l'intro rejouera.
  }
}

/**
 * Ecran d'introduction : soleil qui se couche sur l'horizon de Leonida,
 * entierement dessine en CSS. Aucune capture du jeu, aucune image fictive.
 *
 * Il ne rejoue pas a chaque navigation :
 *   - membre connecte : `user_settings.show_intro` + `intro_seen_at` font foi
 *     (remettre `intro_seen_at` a NULL depuis les parametres le rejoue) ;
 *   - visiteur : un marqueur de sessionStorage suffit, l'intro revient donc
 *     a la prochaine visite.
 */
export function Intro() {
  const { loading, user, settings } = useAuth()
  const reduceMotion = useReduceMotion()
  const [phase, setPhase] = useState<Phase>(() => (sessionSeen() ? 'done' : 'checking'))
  const decided = useRef(false)

  const finish = useCallback(() => {
    markSessionSeen()
    setPhase((current) => (current === 'done' ? current : 'closing'))

    if (!user) return
    // Memorise cote base pour que l'intro ne rejoue pas sur un autre appareil.
    void supabase
      .from('user_settings')
      .update({ intro_seen_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .then(({ error }) => {
        // Echec sans gravite : l'intro se rejouera a la prochaine session.
        if (error) console.warn('[LEONIDA] intro_seen_at non enregistre :', error.message)
      })
  }, [user])

  // 1. Decider s'il faut jouer l'intro, une fois la session connue.
  useEffect(() => {
    if (phase !== 'checking' || decided.current) return

    const decide = (play: boolean) => {
      decided.current = true
      // Intro deja vue : on marque la session tout de suite, pour qu'un simple
      // rechargement d'onglet ne fasse plus clignoter l'ecran de couverture.
      if (!play) markSessionSeen()
      setPhase(play ? 'playing' : 'closing')
    }

    if (!loading) {
      if (!user) {
        decide(true)
        return
      }
      // Ligne de reglages absente (compte tout juste cree) : on joue l'intro.
      decide(settings === null || (settings.show_intro && settings.intro_seen_at === null))
      return
    }

    // Filet de securite : on ne retient jamais l'application pour une intro.
    const timer = window.setTimeout(() => decide(true), 1200)
    return () => window.clearTimeout(timer)
  }, [phase, loading, user, settings])

  // 2. Fin de l'animation.
  useEffect(() => {
    if (phase !== 'playing') return
    const timer = window.setTimeout(finish, reduceMotion ? PLAY_MS_REDUCED : PLAY_MS)
    return () => window.clearTimeout(timer)
  }, [phase, reduceMotion, finish])

  // 3. Fondu de sortie puis demontage.
  useEffect(() => {
    if (phase !== 'closing') return
    const timer = window.setTimeout(() => setPhase('done'), reduceMotion ? 0 : CLOSE_MS)
    return () => window.clearTimeout(timer)
  }, [phase, reduceMotion])

  // Le defilement reste bloque tant que l'intro couvre l'ecran.
  useEffect(() => {
    if (phase === 'done') return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [phase])

  // Echap passe l'intro, comme le bouton.
  useEffect(() => {
    if (phase === 'done' || phase === 'closing') return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') finish() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, finish])

  if (phase === 'done') return null

  return (
    <div className={s.root} data-phase={phase}>
      <div className={s.sky} aria-hidden="true" />
      <div className={s.sun} aria-hidden="true" />
      <div className={s.horizon} aria-hidden="true" />
      <div className={s.water} aria-hidden="true" />

      <div className={s.content}>
        <Logo variant="full" size={46} className={s.logo} />
        <p className={s.mask}>
          <span className={s.tagline}>Actualites, decouvertes et carte de Leonida</span>
        </p>
      </div>

      <button type="button" className={s.skip} onClick={finish}>
        Passer
      </button>
    </div>
  )
}

export default Intro
