import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { qk } from '@/lib/queryKeys'
import {
  getMapConfig, getMarker, listCategories, listMarkers, listMyContributions,
  type MapCategory, type MapConfig, type MapMarker, type MarkerListItem,
} from '@/services/map'

/**
 * Acces aux donnees de la carte. Tout passe par `src/services/map.ts` : ce
 * fichier ne fait que brancher les fonctions existantes sur TanStack Query et
 * les cles centralisees de `@/lib/queryKeys`.
 */

/** Reglage `map.config`. Change rarement : on le garde longtemps en cache. */
export function useMapConfig(): UseQueryResult<MapConfig> {
  return useQuery({
    queryKey: qk.mapConfig,
    queryFn: getMapConfig,
    staleTime: 10 * 60 * 1000,
  })
}

export function useMapCategories(): UseQueryResult<MapCategory[]> {
  return useQuery({
    queryKey: qk.mapCategories,
    queryFn: () => listCategories(),
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * Marqueurs publics : UNIQUEMENT les decouvertes validees (le service impose
 * `status: 'approved'` par defaut, et la RLS le garantit côté serveur).
 *
 * Le filtrage par categorie et la recherche sont volontairement appliques
 * cote client dans la page : les marqueurs tiennent tous en memoire, et
 * refiltrer localement evite un aller-retour reseau a chaque pastille
 * cliquee. La requete reste donc unique et stable.
 */
export function useMapMarkers(): UseQueryResult<MapMarker[]> {
  return useQuery({
    queryKey: qk.mapMarkers({ status: 'approved' }),
    queryFn: () => listMarkers(),
    staleTime: 60 * 1000,
  })
}

/** Fiche complete d'une decouverte, auteur inclus. `null` si invisible. */
export function useMarker(id: string | null): UseQueryResult<MarkerListItem | null> {
  return useQuery({
    queryKey: qk.mapMarker(id ?? 'none'),
    // Le garde rend la non-nullite verifiable par le compilateur : pas de
    // transtypage, et la requete reste desactivee tant qu'aucun id n'existe.
    queryFn: async () => (id === null ? null : getMarker(id)),
    enabled: id !== null,
  })
}

/** Contributions du membre connecte, tous statuts confondus. */
export function useMyContributions(userId: string | null): UseQueryResult<MapMarker[]> {
  return useQuery({
    queryKey: qk.myMarkers,
    queryFn: async () => (userId === null ? [] : listMyContributions(userId)),
    enabled: userId !== null,
  })
}
