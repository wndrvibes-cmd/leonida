import {
  forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState,
  type KeyboardEvent as ReactKeyboardEvent, type ReactNode,
} from 'react'
import { Button, ErrorState, Icon, Spinner } from '@/components/ui'
import type { MapView, MapViewportHandle, RelativePoint } from './types'
import { useMapGestures } from './useMapGestures'
import {
  clamp, clampView, computeFit, preserveCentre, zoomAnchored,
  type Metrics, type ViewState,
} from './viewMath'
import s from './MapViewport.module.css'

/**
 * Moteur de vue de la carte — ecrit a la main, sans bibliotheque de carto.
 * Le modele de coordonnees et le role de `scale` sont documentes dans
 * `viewMath.ts`, les gestes dans `useMapGestures.ts`.
 *
 * PERFORMANCE — pendant un geste, AUCUN rendu React : la transformation est
 * ecrite directement sur le calque, et les epingles se contre-echelonnent
 * seules via la variable CSS `--map-inv`. Le zoom n'est publie vers le parent
 * que lorsqu'il change assez pour justifier un recalcul des regroupements ;
 * un simple deplacement n'en declenche aucun.
 */

export interface MapViewportProps {
  imageUrl: string
  /** Dimensions de `map.config` ; `null` = mesurees sur l'image chargee. */
  naturalWidth: number | null
  naturalHeight: number | null
  minZoom: number
  maxZoom: number
  alt: string
  /** Couche posee DANS le calque transforme (marqueurs). */
  children?: ReactNode
  /** Surcouche posee au-dessus du cadre, hors transformation. */
  overlay?: ReactNode
  onViewChange?: (view: MapView) => void
  /** Appui simple sur le fond de carte, en coordonnees relatives 0..1. */
  onMapTap?: (point: RelativePoint) => void
  /** Mode placement : curseur reticule. */
  placing?: boolean
  className?: string
}

const KEY_PAN_PX = 64
/** Ecart relatif de zoom a partir duquel le parent est prevenu. */
const PUBLISH_RATIO = 0.02

export const MapViewport = forwardRef<MapViewportHandle, MapViewportProps>(
  function MapViewport(props, ref) {
    const {
      imageUrl, naturalWidth, naturalHeight, alt,
      children, overlay, onViewChange, onMapTap, placing = false, className,
    } = props

    /*
     * Garde-fou sur les bornes de `map.config`. Un `min_zoom` nul ou negatif
     * — reglage errone cote administration — donnerait `k = 0`, donc une
     * image de taille nulle, et rendrait indefini le seuil de publication
     * (division par l'echelle precedente). On borne donc ici plutot que de
     * faire confiance au reglage.
     */
    const minZoom = Math.max(props.minZoom, 0.05)
    const maxZoom = Math.max(props.maxZoom, minZoom * 1.01)

    const frameRef = useRef<HTMLDivElement>(null)
    const layerRef = useRef<HTMLDivElement>(null)

    const [dims, setDims] = useState<{ w: number; h: number } | null>(
      naturalWidth && naturalHeight ? { w: naturalWidth, h: naturalHeight } : null,
    )
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
    const [reloadKey, setReloadKey] = useState(0)
    /** Copie basse frequence du zoom : sert au seul etat des boutons. */
    const [uiScale, setUiScale] = useState(minZoom)

    const viewRef = useRef<ViewState>({ scale: minZoom, tx: 0, ty: 0 })
    const metricsRef = useRef<Metrics | null>(null)
    /** `null` = jamais publie : la premiere mesure doit toujours l'etre. */
    const publishedScaleRef = useRef<number | null>(null)
    const publishedFitRef = useRef<number | null>(null)

    const onViewChangeRef = useRef(onViewChange)
    useEffect(() => { onViewChangeRef.current = onViewChange }, [onViewChange])

    /** Ecrit la vue bornee dans le DOM, et publie le zoom si besoin. */
    const commit = useCallback((next: ViewState) => {
      const m = metricsRef.current
      const layer = layerRef.current
      if (!m || !layer) return

      const view = clampView(next, m, minZoom, maxZoom)
      viewRef.current = view

      const k = m.fit * view.scale
      layer.style.transform = `translate3d(${view.tx}px, ${view.ty}px, 0) scale(${k})`
      layer.style.setProperty('--map-k', String(k))
      layer.style.setProperty('--map-inv', String(1 / k))

      /*
       * Publication parcimonieuse. Deux declencheurs seulement :
       *   - le zoom a bouge assez pour changer les regroupements (ou il
       *     vient d'atteindre une borne, pour l'etat des boutons) ;
       *   - le cadre a ete redimensionne, donc `fit` a change a zoom egal.
       * Un simple deplacement ne publie RIEN : c'est ce qui garantit zero
       * rendu React pendant un glissement, meme avec un millier d'epingles.
       */
      const last = publishedScaleRef.current
      const atBound = view.scale === minZoom || view.scale === maxZoom
      const scaleChanged = last === null
        || Math.abs(view.scale - last) / last > PUBLISH_RATIO
        || (atBound && view.scale !== last)

      if (scaleChanged || publishedFitRef.current !== m.fit) {
        publishedScaleRef.current = view.scale
        publishedFitRef.current = m.fit
        setUiScale(view.scale)
        onViewChangeRef.current?.({
          scale: view.scale,
          displayedWidth: k * m.nw,
          displayedHeight: k * m.nh,
        })
      }
    }, [minZoom, maxZoom])

    /* ------------------------------------------------------------- mesures */

    useEffect(() => {
      const frame = frameRef.current
      if (!frame || !dims) return

      const measure = () => {
        const w = frame.clientWidth
        const h = frame.clientHeight
        if (w === 0 || h === 0) return

        const next: Metrics = { fit: computeFit(w, h, dims.w, dims.h), w, h, nw: dims.w, nh: dims.h }
        const previous = metricsRef.current
        metricsRef.current = next

        commit(previous
          ? preserveCentre(viewRef.current, previous, next)
          : { scale: minZoom, tx: 0, ty: 0 })
      }

      measure()
      const observer = new ResizeObserver(measure)
      observer.observe(frame)
      return () => observer.disconnect()
    }, [dims, minZoom, commit])

    /* ------------------------------------------------------------- actions */

    const zoomAt = useCallback((cx: number, cy: number, factor: number) => {
      const view = viewRef.current
      const next = clamp(view.scale * clamp(factor, 0.25, 4), minZoom, maxZoom)
      if (next === view.scale) return
      commit(zoomAnchored(view, cx, cy, next))
    }, [commit, minZoom, maxZoom])

    const panBy = useCallback((dx: number, dy: number) => {
      const view = viewRef.current
      commit({ scale: view.scale, tx: view.tx + dx, ty: view.ty + dy })
    }, [commit])

    const screenToImage = useCallback((px: number, py: number): RelativePoint => {
      const m = metricsRef.current
      const rect = frameRef.current?.getBoundingClientRect()
      if (!m || !rect) return { x: 0, y: 0 }
      const view = viewRef.current
      const k = m.fit * view.scale
      return {
        x: clamp((px - rect.left - view.tx) / (k * m.nw), 0, 1),
        y: clamp((py - rect.top - view.ty) / (k * m.nh), 0, 1),
      }
    }, [])

    const { dragging, onPointerDown } = useMapGestures({
      frameRef, panBy, zoomAt, screenToImage, onMapTap,
    })

    const zoomCentre = useCallback((factor: number) => {
      const m = metricsRef.current
      if (m) zoomAt(m.w / 2, m.h / 2, factor)
    }, [zoomAt])

    const reset = useCallback(() => {
      commit({ scale: minZoom, tx: 0, ty: 0 })
    }, [commit, minZoom])

    const centerOn = useCallback((x: number, y: number, scale?: number) => {
      const m = metricsRef.current
      if (!m) return
      const nextScale = clamp(scale ?? viewRef.current.scale, minZoom, maxZoom)
      const k = m.fit * nextScale
      commit({ scale: nextScale, tx: m.w / 2 - k * x * m.nw, ty: m.h / 2 - k * y * m.nh })
    }, [commit, minZoom, maxZoom])

    useImperativeHandle(ref, (): MapViewportHandle => ({
      reset,
      zoomTo: (scale: number) => {
        const m = metricsRef.current
        if (!m) return
        const next = clamp(scale, minZoom, maxZoom)
        if (next === viewRef.current.scale) return
        zoomAt(m.w / 2, m.h / 2, next / viewRef.current.scale)
      },
      centerOn,
      screenToImage,
    }), [reset, centerOn, screenToImage, zoomAt, minZoom, maxZoom])

    const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const actions: Record<string, () => void> = {
        ArrowLeft:  () => panBy(KEY_PAN_PX, 0),
        ArrowRight: () => panBy(-KEY_PAN_PX, 0),
        ArrowUp:    () => panBy(0, KEY_PAN_PX),
        ArrowDown:  () => panBy(0, -KEY_PAN_PX),
        '+':        () => zoomCentre(1.4),
        '=':        () => zoomCentre(1.4),
        '-':        () => zoomCentre(1 / 1.4),
        '0':        reset,
      }
      const action = actions[event.key]
      if (!action) return
      event.preventDefault()
      action()
    }

    /* --------------------------------------------------------------- rendu */

    return (
      <div
        ref={frameRef}
        className={[s.frame, placing ? s.placing : '', dragging ? s.dragging : '', className]
          .filter(Boolean).join(' ')}
        onPointerDown={onPointerDown}
        onKeyDown={handleKeyDown}
        role="application"
        aria-label="Carte de Leonida. Glissez pour déplacer, pincez ou utilisez la molette pour zoomer. Au clavier : flèches pour déplacer, plus et moins pour zoomer, zero pour la vue d'ensemble."
        tabIndex={0}
      >
        <div ref={layerRef} className={s.layer} style={{ width: dims?.w, height: dims?.h }}>
          <img
            key={reloadKey}
            className={s.image}
            src={imageUrl}
            alt={alt}
            draggable={false}
            decoding="async"
            onLoad={(event) => {
              const img = event.currentTarget
              if (!dims && img.naturalWidth > 0 && img.naturalHeight > 0) {
                setDims({ w: img.naturalWidth, h: img.naturalHeight })
              }
              setStatus('ready')
            }}
            onError={() => setStatus('error')}
          />
          {status === 'ready' ? children : null}
        </div>

        {status === 'loading' ? (
          <div className={s.sheet}>
            <Spinner size="lg" label="Chargement de la carte" />
          </div>
        ) : null}

        {/* L'erreur est posee EN SURCOUCHE, sans demonter le cadre : un
            remplacement d'arbre detacherait le `ResizeObserver` et la vue ne
            serait plus mesuree apres un nouvel essai. */}
        {status === 'error' ? (
          <div className={`${s.sheet} ${s.sheetError}`} data-map-ui>
            <ErrorState
              title="Carte indisponible"
              description="L'image de la carte n'a pas pu être chargée. Vérifiez votre connexion, puis reessayez."
              retryLabel="Recharger l'image"
              onRetry={() => { setStatus('loading'); setReloadKey((n) => n + 1) }}
            />
          </div>
        ) : null}

        <div className={s.controls} data-map-ui>
          <Button
            variant="secondary" size="md" iconOnly aria-label="Zoomer"
            onClick={() => zoomCentre(1.5)} disabled={uiScale >= maxZoom}
          >
            <Icon name="zoom-in" size={20} />
          </Button>
          <Button
            variant="secondary" size="md" iconOnly aria-label="Dezoomer"
            onClick={() => zoomCentre(1 / 1.5)} disabled={uiScale <= minZoom}
          >
            <Icon name="zoom-out" size={20} />
          </Button>
          <Button
            variant="secondary" size="md" iconOnly aria-label="Vue d'ensemble"
            onClick={reset} disabled={uiScale <= minZoom}
          >
            <Icon name="locate" size={20} />
          </Button>
        </div>

        {overlay ? (
          <div className={s.overlay} data-map-ui>
            {overlay}
          </div>
        ) : null}
      </div>
    )
  },
)

export default MapViewport
