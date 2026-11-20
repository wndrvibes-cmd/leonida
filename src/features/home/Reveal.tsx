import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useReduceMotion } from '@/app/motionPreference'

export interface RevealProps {
  children: ReactNode
  /** Decalage en secondes, pour faire apparaitre une rangee en cascade. */
  delay?: number
  className?: string
}

/**
 * Apparition au defilement, jouee UNE SEULE FOIS par element.
 *
 * Seuls `opacity` et `transform` sont animes (aucun recalcul de mise en page),
 * et le composant disparait completement du rendu si le membre a demande la
 * reduction des animations : pas d'animation a duree nulle, pas de wrapper
 * motion inutile.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const reduceMotion = useReduceMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: '0px 0px -6% 0px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
