import { useEffect, type RefObject } from 'react'

const FOCUSABLE = [
  'a[href]', 'button', 'input', 'select', 'textarea',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Verrou de defilement du corps de page.
 * Un compteur partage evite qu'une fermeture de dialogue ne deverrouille le
 * defilement alors qu'un autre calque est encore ouvert (dialogue + panneau).
 */
let lockCount = 0

export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const body = document.body
    if (lockCount === 0) {
      // Compense la disparition de la barre de defilement (desktop).
      const gap = window.innerWidth - document.documentElement.clientWidth
      body.dataset.scrollLocked = 'true'
      body.style.overflow = 'hidden'
      if (gap > 0) body.style.paddingRight = `${gap}px`
    }
    lockCount += 1
    return () => {
      lockCount -= 1
      if (lockCount === 0) {
        delete body.dataset.scrollLocked
        body.style.removeProperty('overflow')
        body.style.removeProperty('padding-right')
      }
    }
  }, [active])
}

/** Piege le focus dans le calque et le rend a l'élément d'origine a la sortie. */
export function useFocusTrap(active: boolean, ref: RefObject<HTMLElement>): void {
  useEffect(() => {
    if (!active) return
    const node = ref.current
    if (!node) return

    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null

    const visibleFocusables = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true',
      )

    const first = visibleFocusables()[0]
    ;(first ?? node).focus({ preventScroll: true })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const list = visibleFocusables()
      if (list.length === 0) {
        event.preventDefault()
        return
      }
      const start = list[0]
      const end = list[list.length - 1]
      if (event.shiftKey && document.activeElement === start) {
        event.preventDefault()
        end.focus()
      } else if (!event.shiftKey && document.activeElement === end) {
        event.preventDefault()
        start.focus()
      }
    }

    node.addEventListener('keydown', onKeyDown)
    return () => {
      node.removeEventListener('keydown', onKeyDown)
      previous?.focus({ preventScroll: true })
    }
  }, [active, ref])
}

export function useEscapeKey(active: boolean, onEscape: () => void): void {
  useEffect(() => {
    if (!active) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onEscape()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [active, onEscape])
}
