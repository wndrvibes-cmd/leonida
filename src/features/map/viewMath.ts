/**
 * Mathematiques de la vue — fonctions pures, sans React ni DOM.
 *
 * MODELE : un calque unique porte l'image a ses dimensions naturelles et la
 * couche de marqueurs, transforme par `translate3d(tx, ty, 0) scale(k)` avec
 * `transform-origin: 0 0`. La conversion est donc exacte et reversible :
 *
 *     ecran   = (tx, ty) + k * image_px
 *     image_px = (ecran - (tx, ty)) / k
 *
 * ECHELLES : `scale` est RELATIF a la vue d'ensemble — a `minZoom`, l'image
 * entiere tient dans le cadre. Le facteur CSS reel vaut `k = fit * scale`, ou
 * `fit = min(cadre.w / image.w, cadre.h / image.h)`. Traiter `min_zoom` comme
 * un facteur absolu rendrait la vue d'ensemble impossible sur telephone avec
 * une image de plusieurs milliers de pixels de large.
 */

export interface ViewState { scale: number; tx: number; ty: number }

/** Mesures courantes du cadre et de l'image. */
export interface Metrics {
  /** Facteur d'ajustement « image entiere visible ». */
  fit: number
  /** Dimensions du cadre, en pixels CSS. */
  w: number
  h: number
  /** Dimensions naturelles de l'image, en pixels. */
  nw: number
  nh: number
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function computeFit(w: number, h: number, nw: number, nh: number): number {
  return Math.min(w / nw, h / nh)
}

/**
 * Borne la vue : `scale` reste dans [minZoom, maxZoom] et l'image ne peut
 * jamais sortir du cadre. Quand l'image est plus petite que le cadre sur un
 * axe, elle y est centree plutot que collee a un bord.
 */
export function clampView(
  next: ViewState, m: Metrics, minZoom: number, maxZoom: number,
): ViewState {
  const scale = clamp(next.scale, minZoom, maxZoom)
  const k = m.fit * scale
  const dw = k * m.nw
  const dh = k * m.nh
  return {
    scale,
    tx: dw <= m.w ? (m.w - dw) / 2 : Math.min(0, Math.max(m.w - dw, next.tx)),
    ty: dh <= m.h ? (m.h - dh) / 2 : Math.min(0, Math.max(m.h - dh, next.ty)),
  }
}

/**
 * Zoom ancre sur un point du cadre : le point de l'image situe sous le
 * curseur (ou entre les deux doigts) ne bouge pas d'un pixel.
 */
export function zoomAnchored(
  view: ViewState, cx: number, cy: number, nextScale: number,
): ViewState {
  const ratio = nextScale / view.scale
  return {
    scale: nextScale,
    tx: cx - ratio * (cx - view.tx),
    ty: cy - ratio * (cy - view.ty),
  }
}

/**
 * Conserve le point image qui occupait le centre du cadre apres un
 * redimensionnement ou une rotation d'ecran : sans cela, la carte saute.
 */
export function preserveCentre(
  view: ViewState, previous: Metrics, next: Metrics,
): ViewState {
  const kPrev = previous.fit * view.scale
  const ix = (previous.w / 2 - view.tx) / kPrev
  const iy = (previous.h / 2 - view.ty) / kPrev
  const k = next.fit * view.scale
  return { scale: view.scale, tx: next.w / 2 - k * ix, ty: next.h / 2 - k * iy }
}
