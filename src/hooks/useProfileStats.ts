import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { qk } from '@/lib/queryKeys'
import { useAuth } from '@/app/AuthProvider'
import { getProfileStats, type ProfileStats } from '@/services/profiles'

/**
 * Statistiques reelles d'un profil.
 *
 * La cle derive de `qk.profile(id)` : invalider le profil invalide aussi ses
 * statistiques, TanStack Query faisant une correspondance par prefixe.
 *
 * `includeDrafts` n'est demande que si le visiteur est l'auteur ou un membre
 * du staff. Pour les autres, `markersProposed` vaut `null` : la RLS ne leur
 * montre que les decouvertes validees, afficher un total partiel serait faux.
 */
export function useProfileStats(
  userId: string | null | undefined,
): UseQueryResult<ProfileStats> {
  const { user, isStaff } = useAuth()
  const includeDrafts = Boolean(userId) && (userId === user?.id || isStaff)

  return useQuery({
    queryKey: [...qk.profile(userId ?? 'anonyme'), 'stats', includeDrafts],
    queryFn: () => getProfileStats(userId as string, { includeDrafts }),
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  })
}
