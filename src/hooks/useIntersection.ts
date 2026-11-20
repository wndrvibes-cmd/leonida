import { useEffect, useState } from 'react'

export interface UseIntersectionOptions {
  root?: Element | null
  /** Marge d'anticipation : le chargement part avant que la cible soit visible. */
  rootMargin?: string
  threshold?: number
  /** `true` : on arrete d'observer apres la premiere apparition. */
  once?: boolean
  enabled?: boolean
}

export interface UseIntersectionResult {
  /** A poser sur l'element sentinelle : `<div ref={ref} />`. */
  ref: (node: Element | null) => void
  isIntersecting: boolean
}

/**
 * Observation de visibilite, pour le chargement progressif (page suivante
 * d'un feed, images differees).
 *
 * La reference est une FONCTION et non un `useRef` : la sentinelle d'un feed
 * est montee et demontee au fil des pages, et un objet ref ne previendrait pas
 * du remplacement de l'element. Ici, chaque changement de noeud re-declenche
 * l'observation.
 */
export function useIntersection(options: UseIntersectionOptions = {}): UseIntersectionResult {
  const { root = null, rootMargin = '200px', threshold = 0, once = false, enabled = true } = options

  const [node, setNode] = useState<Element | null>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    if (!node || !enabled) return

    // Navigateur sans IntersectionObserver : on considere la cible visible
    // pour ne pas bloquer le chargement de la suite.
    if (typeof IntersectionObserver === 'undefined') {
      setIsIntersecting(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return
        setIsIntersecting(entry.isIntersecting)
        if (entry.isIntersecting && once) observer.disconnect()
      },
      { root, rootMargin, threshold },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [node, enabled, root, rootMargin, threshold, once])

  return { ref: setNode, isIntersecting }
}
