import type { Transition, Variants } from 'framer-motion'

/**
 * Systeme de mouvement de LEONIDA.
 *
 * POURQUOI CE FICHIER : avant lui, chaque module inventait ses durees et ses
 * courbes — 15 `@keyframes` disperses, des ressorts differents d'un ecran a
 * l'autre. Le mouvement est une composante de l'identite au meme titre que la
 * couleur : il se declare une fois.
 *
 * Trois regles tenues partout :
 *   1. on n'anime que `transform` et `opacity` (aucun recalcul de mise en page) ;
 *   2. l'entree est lente et detendue, la sortie est rapide — une interface
 *      doit paraitre reactive, jamais collante ;
 *   3. toute animation doit rester lisible a 60 images par seconde sur un
 *      telephone d'il y a trois ans.
 *
 * La reduction de mouvement est geree en amont par `useReduceMotion()` : les
 * composants ne montent pas ces variantes du tout plutot que de les jouer a
 * duree nulle.
 */

/* ------------------------------------------------------------ COURBES --- */

/** Entree : demarre vite, se pose en douceur. */
export const EASE_ENTRANCE = [0.16, 1, 0.3, 1] as const

/** Sortie : part franchement, sans trainer. */
export const EASE_EXIT = [0.7, 0, 0.84, 0] as const

/** Ressort des elements qui glissent (pastilles d'onglet, poignees). */
export const SPRING_SLIDE: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 36,
  mass: 0.8,
}

/** Ressort plus rond, pour ce qui apparait (fiches, modales). */
export const SPRING_POP: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 28,
}

export const DUR = {
  instant: 0.09,
  fast: 0.16,
  base: 0.26,
  slow: 0.44,
} as const

/* ------------------------------------------------------------ ENTREES --- */

/** Apparition standard : monte de quelques pixels en se revelant. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE_ENTRANCE } },
}

/** Variante discrete pour les elements secondaires. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DUR.base, ease: EASE_ENTRANCE } },
}

/** Fiche ou panneau qui s'ouvre : leger agrandissement, jamais de rotation. */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: SPRING_POP },
  exit: { opacity: 0, scale: 0.98, y: 4, transition: { duration: DUR.fast, ease: EASE_EXIT } },
}

/** Feuille montante sur mobile. */
export const sheetUp: Variants = {
  hidden: { y: '100%' },
  visible: { y: 0, transition: SPRING_POP },
  exit: { y: '100%', transition: { duration: DUR.base, ease: EASE_EXIT } },
}

/* ------------------------------------------------------------ CASCADE --- */

/**
 * Conteneur d'une liste qui se revele element par element.
 *
 * Le pas est calcule par `staggerStepFor()` en fonction du nombre d'elements :
 * au-dela d'une poignee, un decalage fixe cumule une attente perceptible et la
 * page parait lente. Une cascade courte sur les premiers elements vaut toujours
 * mieux qu'une vague interminable.
 */
export const staggerList = (step: number): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: step, when: 'beforeChildren' },
  },
})

/** Pas de cascade borne : le retard cumule ne depasse jamais `max` secondes. */
export function staggerStepFor(count: number, max = 0.27, step = 0.045): number {
  if (count <= 1) return 0
  return Math.min(step, max / (count - 1))
}

/* ------------------------------------------------- INTERACTIONS CARTE --- */

/** Survol d'une carte cliquable. Discret : 2px, pas un rebond. */
export const cardHover = {
  rest: { y: 0 },
  hover: { y: -3, transition: { duration: DUR.fast, ease: EASE_ENTRANCE } },
  tap: { y: -1, scale: 0.995, transition: { duration: DUR.instant } },
} as const

/** Retour tactile d'un bouton ou d'une pastille. */
export const pressable = {
  rest: { scale: 1 },
  hover: { scale: 1.02, transition: { duration: DUR.fast } },
  tap: { scale: 0.97, transition: { duration: DUR.instant } },
} as const

/* -------------------------------------------------- APPARITION AU SCROLL */

/**
 * Reglages partages des revelations au defilement.
 * `once: true` : une section deja vue ne rejoue jamais son animation quand on
 * remonte — rien n'est plus fatigant qu'une page qui clignote au retour.
 */
export const VIEWPORT_ONCE = { once: true, amount: 0.15, margin: '0px 0px -8% 0px' } as const
