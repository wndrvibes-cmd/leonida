/**
 * Module carte de LEONIDA.
 *
 *   import { MapViewport, MarkerLayer } from '@/features/map'
 *
 * Le moteur de vue (`MapViewport`) est maison : pas de Leaflet, pas de
 * dependance de cartographie. Les coordonnees des marqueurs sont toujours
 * relatives a l'image d'origine (0..1), comme en base.
 */

export { MapViewport } from './MapViewport'
export type { MapViewportProps } from './MapViewport'

export { MarkerLayer } from './MarkerLayer'
export type { MarkerLayerProps } from './MarkerLayer'

export { MarkerDetail } from './MarkerDetail'
export type { MarkerDetailProps } from './MarkerDetail'

export { MapToolbar } from './MapToolbar'
export type { MapToolbarProps } from './MapToolbar'

export { CategoryChip } from './CategoryChip'
export type { CategoryChipProps } from './CategoryChip'

export { ContributeButton, ContributeDialog, PlacementBanner } from './ContributeFlow'
export type { ContributeDialogProps } from './ContributeFlow'

export { ContributionForm } from './ContributionForm'
export type { ContributionFormProps, ContributionValues } from './ContributionForm'

export { MyContributions } from './MyContributions'
export type { MyContributionsProps } from './MyContributions'

export { useContributeFlow } from './useContributeFlow'
export type { ContributeFlow, ContributeStep } from './useContributeFlow'

export {
  useMapCategories, useMapConfig, useMapMarkers, useMarker, useMyContributions,
} from './useMapQueries'

export { CLUSTER_THRESHOLD, clusterMarkers } from './clustering'
export { categoryAccent, categoryIcon, FALLBACK_CATEGORY_ICON } from './categoryIcons'

export type {
  MapItem, MapView, MapViewportHandle, MarkerWithCategory, RelativePoint,
} from './types'
