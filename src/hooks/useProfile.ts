import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { qk } from '@/lib/queryKeys'
import { useAuth } from '@/app/AuthProvider'
import {
  getProfile, getProfileByUsername, isUsernameAvailable, updateProfile,
  type Profile, type ProfileEditable,
} from '@/services/profiles'

export function useProfile(id: string | null | undefined): UseQueryResult<Profile | null> {
  return useQuery({
    queryKey: qk.profile(id ?? 'anonyme'),
    queryFn: () => getProfile(id as string),
    enabled: Boolean(id),
  })
}

export function useProfileByUsername(
  username: string | null | undefined,
): UseQueryResult<Profile | null> {
  return useQuery({
    queryKey: qk.profileByName(username ?? ''),
    queryFn: () => getProfileByUsername(username as string),
    enabled: Boolean(username),
  })
}

/**
 * Mise a jour du profil du membre connecte.
 *
 * `refresh()` du AuthProvider est rappele apres succes : l'avatar et le nom
 * affiches dans la barre de navigation viennent de la, pas du cache Query.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { user, profile, refresh } = useAuth()

  return useMutation({
    mutationFn: (patch: ProfileEditable) => {
      if (!user) throw new Error('Vous devez être connecte pour modifier votre profil.')
      return updateProfile(user.id, patch)
    },
    onSuccess: async (next) => {
      queryClient.setQueryData(qk.profile(next.id), next)
      // L'ancien pseudonyme ne doit pas rester en cache sous sa cle d'URL.
      if (profile?.username && profile.username !== next.username) {
        void queryClient.invalidateQueries({ queryKey: qk.profileByName(profile.username) })
      }
      queryClient.setQueryData(qk.profileByName(next.username), next)
      await refresh()
    },
  })
}

/**
 * Verification indicative de disponibilite d'un pseudonyme.
 * La contrainte d'unicité de la base reste l'arbitre final.
 */
export function useUsernameAvailability(username: string): UseQueryResult<boolean> {
  const { user } = useAuth()
  const candidate = username.trim()

  return useQuery({
    queryKey: ['username-availability', candidate, user?.id ?? null],
    queryFn: () => isUsernameAvailable(candidate, user?.id),
    enabled: candidate.length >= 3,
    staleTime: 30 * 1000,
  })
}
