import {
  useCallback, useEffect, useRef, useState,
  type PointerEvent as ReactPointerEvent, type RefObject,
} from 'react'
import type { RelativePoint } from './types'

/**
 * Gestes de la carte : souris, tactile et clavier.
 *
 *   - molette          : zoom centre sur le curseur
 *   - glisser          : deplacement
 *   - un doigt         : deplacement
 *   - deux doigts      : pincement, zoom centre entre les doigts
 *   - double-clic/tap  : zoom avant
 *
 * Les deplacements et relachements sont ecoutes sur la FENETRE : un
 * glissement qui sort du cadre continue de fonctionner, et un doigt leve
 * hors de l'element reste comptabilise. La molette est ecoutee en non passif,
 * sans quoi `preventDefault()` serait ignore et la page defilerait.
 */

const TAP_SLOP_PX = 8
const DOUBLE_TAP_MS = 300
const DOUBLE_TAP_PX = 32
/**
 * Delai de resolution d'un appui simple. Un double-appui zoome : on attend
 * donc brievement avant de signaler un appui simple, sinon un double-appui
 * poserait d'abord un repere de contribution avant de zoomer.
 */
const TAP_RESOLVE_MS = 260

export interface MapGestureOptions {
  frameRef: RefObject<HTMLDivElement>
  panBy: (dx: number, dy: number) => void
  /** `factor` multiplie l'echelle courante ; (cx, cy) sont relatifs au cadre. */
  zoomAt: (cx: number, cy: number, factor: number) => void
  screenToImage: (px: number, py: number) => RelativePoint
  /** Appui simple sur le FOND de carte (jamais sur une epingle). */
  onMapTap?: (point: RelativePoint) => void
}

export interface MapGestures {
  dragging: boolean
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
}

export function useMapGestures(options: MapGestureOptions): MapGestures {
  const { frameRef, panBy, zoomAt, screenToImage, onMapTap } = options

  const [dragging, setDragging] = useState(false)

  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const pinchRef = useRef<{ dist: number; mid: { x: number; y: number } } | null>(null)
  const downRef = useRef<{ x: number; y: number; onMarker: boolean } | null>(null)
  const movedRef = useRef(false)
  const lastTapRef = useRef<{ x: number; y: number; t: number } | null>(null)
  const tapTimerRef = useRef<number | null>(null)

  const onMapTapRef = useRef(onMapTap)
  useEffect(() => { onMapTapRef.current = onMapTap }, [onMapTap])

  /** Neutralise le `click` qui suit un glissement : il ne doit rien ouvrir. */
  const suppressNextClick = useCallback(() => {
    const frame = frameRef.current
    if (!frame) return
    const stop = (event: MouseEvent) => {
      event.stopPropagation()
      event.preventDefault()
    }
    frame.addEventListener('click', stop, { capture: true, once: true })
    // Sur tactile aucun `click` ne suit : l'ecouteur est retire de toute facon.
    window.setTimeout(() => frame.removeEventListener('click', stop, { capture: true }), 400)
  }, [frameRef])

  const resolveTap = useCallback((clientX: number, clientY: number) => {
    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect) return

    const now = Date.now()
    const last = lastTapRef.current
    const isDouble = last !== null
      && now - last.t < DOUBLE_TAP_MS
      && Math.hypot(clientX - last.x, clientY - last.y) < DOUBLE_TAP_PX

    if (isDouble) {
      if (tapTimerRef.current !== null) {
        window.clearTimeout(tapTimerRef.current)
        tapTimerRef.current = null
      }
      lastTapRef.current = null
      zoomAt(clientX - rect.left, clientY - rect.top, 2)
      return
    }

    lastTapRef.current = { x: clientX, y: clientY, t: now }
    if (!onMapTapRef.current) return
    tapTimerRef.current = window.setTimeout(() => {
      tapTimerRef.current = null
      onMapTapRef.current?.(screenToImage(clientX, clientY))
    }, TAP_RESOLVE_MS)
  }, [frameRef, zoomAt, screenToImage])

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const target = event.target as Element | null

    /*
     * L'habillage pose sur la carte (commandes de zoom, bandeau de placement)
     * garde ses propres gestes. Sans ce filtre, appuyer sur « Continuer »
     * declencherait AUSSI un appui carte — donc un repere pose sous le
     * bouton — et un glissement sur une commande serait pris pour un
     * deplacement de la carte.
     */
    if (target?.closest?.('[data-map-ui]')) return

    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    movedRef.current = false
    downRef.current = {
      x: event.clientX,
      y: event.clientY,
      // Un appui sur une epingle appartient a l'epingle : la carte ne doit
      // pas y poser en plus un repere de contribution.
      onMarker: Boolean(target?.closest?.('[data-map-marker]')),
    }

    if (pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values())
      if (a && b) {
        pinchRef.current = {
          dist: Math.hypot(a.x - b.x, a.y - b.y),
          mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        }
      }
    }
    setDragging(true)
  }, [])

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const pointers = pointersRef.current
      const previous = pointers.get(event.pointerId)
      if (!previous) return
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

      const down = downRef.current
      if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) > TAP_SLOP_PX) {
        movedRef.current = true
      }

      if (pointers.size === 1) {
        panBy(event.clientX - previous.x, event.clientY - previous.y)
        return
      }

      const [a, b] = Array.from(pointers.values())
      const rect = frameRef.current?.getBoundingClientRect()
      if (!a || !b || !rect) return

      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const pinch = pinchRef.current
      if (pinch && pinch.dist > 0) {
        // Le milieu des doigts deplace la carte ; leur ecartement la zoome
        // autour de ce meme milieu.
        panBy(mid.x - pinch.mid.x, mid.y - pinch.mid.y)
        zoomAt(mid.x - rect.left, mid.y - rect.top, dist / pinch.dist)
        movedRef.current = true
      }
      pinchRef.current = { dist, mid }
    }

    const handleUp = (event: PointerEvent) => {
      const pointers = pointersRef.current
      if (!pointers.delete(event.pointerId)) return
      if (pointers.size < 2) pinchRef.current = null
      if (pointers.size > 0) return

      setDragging(false)
      const down = downRef.current
      downRef.current = null
      if (!down) return
      if (movedRef.current) { suppressNextClick(); return }
      if (down.onMarker || event.type === 'pointercancel') return
      resolveTap(event.clientX, event.clientY)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleUp)
    }
  }, [frameRef, panBy, zoomAt, resolveTap, suppressNextClick])

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = frame.getBoundingClientRect()
      // Les pavés tactiles envoient des pixels, les molettes des lignes.
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rect.height : 1
      zoomAt(
        event.clientX - rect.left,
        event.clientY - rect.top,
        Math.exp(-event.deltaY * unit * 0.0022),
      )
    }
    frame.addEventListener('wheel', handleWheel, { passive: false })
    return () => frame.removeEventListener('wheel', handleWheel)
  }, [frameRef, zoomAt])

  useEffect(() => () => {
    if (tapTimerRef.current !== null) window.clearTimeout(tapTimerRef.current)
  }, [])

  return { dragging, onPointerDown }
}
