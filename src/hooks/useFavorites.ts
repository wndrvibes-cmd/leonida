import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { qk } from '@/lib/queryKeys'
import { useAuth } from '@/app/AuthProvider'
import {
  getMyFavoriteIds, isFavorite, listFavoritesDetailed, toggleFavorite, type FavoriteEntry,
} from '@/services/favorites'
import type { Database } from '@/types/database'

type TargetType = Database['public']['Enums']['target_type']

/** Les favoris sont prives : la requete est desactivee hors session. */
export function useFavorites(targetType?: TargetType): UseQueryResult<FavoriteEntry[]> {
  const { user } = useAuth()

  return useQuery({
    queryKey: [...qk.favorites(targetType), user?.id ?? 'anonyme'],
    queryFn: () => listFavoritesDetailed(user?.id as string, targetType),
    enabled: Boolean(user),
  })
}

export function useIsFavorite(
  targetType: TargetType,
  targetId: string | null | undefined,
): UseQueryResult<boolean> {
  const { user } = useAuth()

  return useQuery({
    // Segment 'one' : distingue sans ambiguite l'etat d'UN contenu de la liste
    // complete et des lots, qui partagent le meme prefixe.
    queryKey: [...qk.favorites(targetType), 'one', targetId ?? '', user?.id ?? 'anonyme'],
    queryFn: () => isFavorite(user?.id as string, targetType, targetId as string),
    enabled: Boolean(user && targetId),
  })
}

/**
 * Favoris du membre sur une page entiere de contenus, en UNE requete.
 * A utiliser dans un feed plutot que `useIsFavorite` par ligne.
 */
export function useMyFavoriteIds(
  targetType: TargetType,
  targetIds: string[],
): UseQueryResult<Set<string>> {
  const { user } = useAuth()
  const signature = [...targetIds].sort().join('|')

  return useQuery({
    queryKey: [...qk.favorites(targetType), 'mine', user?.id ?? 'anonyme', signature],
    queryFn: () => getMyFavoriteIds(user?.id as string, targetType, targetIds),
    enabled: Boolean(user) && targetIds.length > 0,
  })
}

/**
 * Bascule un favori. La valeur renvoyee est l'etat final confirme par la base,
 * pas une supposition : l'icone reflete donc toujours la realite.
 */
export function useToggleFavorite(targetType: TargetType, targetId: string) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: () => {
      if (!user) throw new Error('Vous devez être connecte pour enregistrer un favori.')
      return toggleFavorite(user.id, targetType, targetId)
    },
    onSuccess: (favorited) => {
      queryClient.setQueryData(
        [...qk.favorites(targetType), 'one', targetId, user?.id ?? 'anonyme'],
        favorited,
      )
      // Prefixe ['favorites', <type>] : couvre la liste du type et les etats
      // unitaires. La liste « tous types » a sa propre cle.
      void queryClient.invalidateQueries({ queryKey: qk.favorites(targetType) })
      void queryClient.invalidateQueries({ queryKey: qk.favorites() })
    },
  })
}
