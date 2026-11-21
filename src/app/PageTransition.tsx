import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useReduceMotion } from '@/app/motionPreference'

/**
 * Transition d'entree entre les pages.
 *
 * CHOIX : on anime seulement l'ENTREE, pas la sortie.
 *
 * Avec `<AnimatePresence mode="wait">`, la page sortante doit finir son
 * animation avant que l'entrante commence : la navigation parait deux fois
 * plus lente, et le probleme empire avec les routes chargees en `lazy`, ou
 * l'attente reseau s'ajoute a l'attente d'animation.
 *
 * Ici, la cle `pathname` force React a remonter le contenu a chaque route :
 * l'animation d'entree se declenche naturellement, sans retard ajoute.
 *
 * Le deplacement est volontairement court (10px) : au-dela, l'oeil suit le
 * mouvement au lieu de lire la page.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const reduceMotion = useReduceMotion()

  if (reduceMotion) return <>{children}</>

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default PageTransition
