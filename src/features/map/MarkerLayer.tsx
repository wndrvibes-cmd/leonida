import {
  useCallback, useEffect, useRef,
  type CSSProperties, type PointerEvent as ReactPointerEvent,
} from 'react'
import { Icon } from '@/components/ui'
import { categoryAccent, categoryIcon } from './categoryIcons'
import type { MapItem, MarkerWithCategory, RelativePoint } from './types'
import s from './MarkerLayer.module.css'

/**
 * Couche de marqueurs — posee DANS le calque transforme de `MapViewport`.
 *
 * POSITIONNEMENT : chaque repere est place en `left: x * 100%` /
 * `top: y * 100%` a l'interieur du calque, qui mesure exactement les
 * dimensions naturelles de l'image. Les coordonnees stockees en base (0..1)
 * sont donc utilisees telles quelles, et restent exactes quels que soient le
 * zoom, le deplacement, la taille de l'écran ou l'orientation.
 *
 * TAILLE CONSTANTE : le calque est mis a l'echelle `k`, ce qui grossirait les
 * epingles avec la carte. Chacune applique donc la contre-echelle
 * `scale(var(--map-inv))` — soit `1 / k` — autour de sa pointe
 * (`transform-origin: 50% 100%`), si bien que la pointe reste rivee a sa
 * coordonnee pendant que l'épingle garde une taille lisible a l'ecran.
 */

export interface MarkerLayerProps {
  items: MapItem[]
  selectedId: string | null
  onSelect: (marker: MarkerWithCategory) => void
  /** Clic sur un regroupement : la carte zoome dessus. */
  onCluster: (point: RelativePoint) => void
  /** Repere de contribution en cours de placement, deplacable. */
  preview?: RelativePoint | null
  onPreviewMove?: (point: RelativePoint) => void
  /** Conversion fournie par le moteur de vue, pour le glissement du repere. */
  screenToImage?: (px: number, py: number) => RelativePoint
}

function anchorStyle(point: RelativePoint): CSSProperties {
  return { left: `${point.x * 100}%`, top: `${point.y * 100}%` }
}

/**
 * Couleur de categorie passee en propriete personnalisee. `CSSProperties` ne
 * declare pas les variables CSS : l'assertion est l'idiome usuel, et elle
 * reste sure puisque la valeur est validee par `categoryAccent`.
 */
function accentStyle(accent: string): CSSProperties {
  return { '--pin-accent': accent } as CSSProperties
}

export function MarkerLayer(props: MarkerLayerProps) {
  const { items, selectedId, onSelect, onCluster, preview, onPreviewMove, screenToImage } = props

  return (
    <div className={s.layer}>
      {items.map((item) => {
        if (item.kind === 'cluster') {
          return (
            <div key={item.id} className={s.anchor} style={anchorStyle(item.point)}>
              <button
                type="button"
                data-map-marker
                className={s.cluster}
                onClick={() => onCluster(item.point)}
                aria-label={`${item.entries.length} decouvertes groupees. Zoomer pour les separer.`}
              >
                {item.entries.length}
              </button>
            </div>
          )
        }

        const { marker, category } = item.entry
        const selected = marker.id === selectedId
        return (
          <div key={item.id} className={s.anchor} style={anchorStyle(item.point)}>
            <button
              type="button"
              data-map-marker
              className={`${s.pin} ${selected ? s.pinSelected : ''}`}
              style={accentStyle(categoryAccent(category?.accent))}
              onClick={() => onSelect(item.entry)}
              aria-label={
                category
                  ? `${marker.title}. Categorie : ${category.label}.`
                  : marker.title
              }
              aria-pressed={selected}
            >
              <span className={s.pinBody}>
                <Icon name={categoryIcon(category?.icon)} size={17} />
              </span>
              <span className={s.pinTip} aria-hidden="true" />
            </button>
          </div>
        )
      })}

      {preview && onPreviewMove && screenToImage ? (
        <PreviewPin point={preview} onMove={onPreviewMove} screenToImage={screenToImage} />
      ) : null}
    </div>
  )
}

interface PreviewPinProps {
  point: RelativePoint
  onMove: (point: RelativePoint) => void
  screenToImage: (px: number, py: number) => RelativePoint
}

/**
 * Repere de previsualisation d'une contribution.
 *
 * Il intercepte ses propres gestes (`stopPropagation`) : saisir le repere le
 * deplace, au lieu de faire glisser la carte sous lui.
 */
function PreviewPin({ point, onMove, screenToImage }: PreviewPinProps) {
  const draggingRef = useRef(false)
  const onMoveRef = useRef(onMove)
  const screenToImageRef = useRef(screenToImage)

  useEffect(() => { onMoveRef.current = onMove }, [onMove])
  useEffect(() => { screenToImageRef.current = screenToImage }, [screenToImage])

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      if (!draggingRef.current) return
      event.preventDefault()
      onMoveRef.current(screenToImageRef.current(event.clientX, event.clientY))
    }
    const handleUp = () => { draggingRef.current = false }

    window.addEventListener('pointermove', handleMove, { passive: false })
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleUp)
    }
  }, [])

  const handleDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
    draggingRef.current = true
  }, [])

  /** Au clavier, le repere se deplace par pas de 0,5 % de l'image. */
  const nudge = (dx: number, dy: number) => {
    onMove({
      x: Math.min(1, Math.max(0, point.x + dx)),
      y: Math.min(1, Math.max(0, point.y + dy)),
    })
  }

  return (
    <div className={s.anchor} style={anchorStyle(point)}>
      <div
        data-map-marker
        className={s.preview}
        onPointerDown={handleDown}
        role="button"
        tabIndex={0}
        aria-label={
          'Repère de votre découverte. Faites-le glisser pour l\'ajuster, '
          + 'ou utilisez les flèches du clavier.'
        }
        onKeyDown={(event) => {
          const step = 0.005
          const moves: Record<string, [number, number]> = {
            ArrowLeft: [-step, 0], ArrowRight: [step, 0],
            ArrowUp: [0, -step], ArrowDown: [0, step],
          }
          const move = moves[event.key]
          if (!move) return
          event.preventDefault()
          event.stopPropagation()
          nudge(move[0], move[1])
        }}
      >
        <span className={s.previewBody}>
          <Icon name="plus" size={18} />
        </span>
        <span className={s.previewTip} aria-hidden="true" />
      </div>
    </div>
  )
}

export default MarkerLayer
