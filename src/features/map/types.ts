import type { MapCategory, MapMarker } from '@/services/map'

/**
 * Types partages par le module carte.
 *
 * CONVENTION DE COORDONNEES — toute position de marqueur est RELATIVE a
 * l'image d'origine : `x` et `y` valent 0..1. C'est ce que stocke la base
 * (`map_markers.x` / `map_markers.y`), et c'est la seule representation qui
 * reste exacte quels que soient le zoom, le deplacement, la taille de l'ecran
 * ou l'orientation de l'appareil. Aucun pixel d'écran n'est jamais persiste.
 */
export interface RelativePoint {
  x: number
  y: number
}

/** Etat de vue publie par `MapViewport` quand le zoom change notablement. */
export interface MapView {
  /**
   * Facteur RELATIF a la vue d'ensemble : a `minZoom`, l'image entiere tient
   * dans le cadre. C'est l'echelle bornee par `min_zoom` / `max_zoom` du
   * reglage `map.config`.
   */
  scale: number
  /**
   * Dimensions de l'image telle qu'elle est affichee, en pixels d'ecran.
   * C'est la seule mesure dont le regroupement a besoin : il raisonne en
   * distance a l'écran, pas en pixels de l'image d'origine.
   */
  displayedWidth: number
  displayedHeight: number
}

/** API imperative exposee par `MapViewport` via `ref`. */
export interface MapViewportHandle {
  /** Revient a la vue d'ensemble (image entiere, centree). */
  reset: () => void
  /** Va a une echelle donnee, en conservant le centre du cadre. */
  zoomTo: (scale: number) => void
  /** Centre la vue sur un point relatif 0..1, avec une echelle facultative. */
  centerOn: (x: number, y: number, scale?: number) => void
  /** Convertit des coordonnees ecran (clientX/clientY) en point relatif 0..1. */
  screenToImage: (px: number, py: number) => RelativePoint
}

/** Un marqueur accompagne de sa categorie resolue (ou `null` si retiree). */
export interface MarkerWithCategory {
  marker: MapMarker
  category: MapCategory | null
}

/**
 * Element affiche par la couche de marqueurs : soit une epingle unique, soit
 * un regroupement de proximite. Les deux portent un point relatif 0..1.
 */
export type MapItem =
  | { kind: 'pin'; id: string; point: RelativePoint; entry: MarkerWithCategory }
  | { kind: 'cluster'; id: string; point: RelativePoint; entries: MarkerWithCategory[] }
