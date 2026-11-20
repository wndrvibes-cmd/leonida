import { useEffect, type RefObject } from 'react'

/**
 * Appelle `handler` quand on agit en dehors de l'element.
 *
 * `pointerdown` plutot que `click` : sur iPhone, un `click` arrive apres un
 * delai et peut se produire alors que le panneau a deja change ; `pointerdown`
 * couvre souris, doigt et stylet d'un seul abonnement.
 */
export function useOnClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: PointerEvent) => void,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return

    const onPointerDown = (event: PointerEvent) => {
      const node = ref.current
      if (!node) return
      const target = event.target
      if (target instanceof Node && node.contains(target)) return
      handler(event)
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [ref, handler, enabled])
}
