import { motion } from 'framer-motion'
import { cx } from './cx'
import s from './Spinner.module.css'

export type SpinnerSize = 'sm' | 'md' | 'lg'

const DIMENSIONS: Record<SpinnerSize, number> = { sm: 16, md: 22, lg: 34 }

export interface SpinnerProps {
  size?: SpinnerSize
  /** Texte lu par les lecteurs d'ecran. */
  label?: string
  /** Masque le texte accessible quand un parent annonce deja le chargement. */
  silent?: boolean
  className?: string
}

/**
 * La rotation est pilotee par framer-motion et non par les jetons de duree :
 * un indicateur de chargement figé mentirait sur l'etat reel de l'ecran,
 * y compris lorsque le membre a demande la reduction des animations.
 */
export function Spinner({ size = 'md', label = 'Chargement…', silent = false, className }: SpinnerProps) {
  const px = DIMENSIONS[size]

  return (
    <span className={cx(s.wrap, className)} role={silent ? undefined : 'status'}>
      <motion.svg
        className={s.svg}
        width={px}
        height={px}
        viewBox="0 0 24 24"
        aria-hidden="true"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, ease: 'linear', repeat: Infinity }}
      >
        <circle className={s.track} cx="12" cy="12" r="9" />
        <circle className={s.head} cx="12" cy="12" r="9" />
      </motion.svg>
      {silent ? null : <span className="sr-only">{label}</span>}
    </span>
  )
}
