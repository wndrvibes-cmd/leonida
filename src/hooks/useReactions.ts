import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { qk } from '@/lib/queryKeys'
import { useAuth } from '@/app/AuthProvider'
import {
  getMyReactions, getReactionSummary, removeReaction, setReaction, type ReactionSummary,
} from '@/services/reactions'
import type { Database } from '@/types/database'

type TargetType = Database['public']['Enums']['target_type']
type ReactionType = Database['public']['Enums']['reaction_type']

export function useReactionSummary(
  targetType: TargetType,
  targetId: string | null | undefined,
): UseQueryResult<ReactionSummary> {
  const { user } = useAuth()

  return useQuery({
    // L'identifiant du membre fait partie de la cle : `mine` differe d'un
    // compte a l'autre, et le cache ne doit pas fuir d'une session a la suivante.
    queryKey: [...qk.reactions(targetType, targetId ?? ''), user?.id ?? 'anonyme'],
    queryFn: () => getReactionSummary(targetType, targetId as string, user?.id),
    enabled: Boolean(targetId),
    staleTime: 30 * 1000,
  })
}

/**
 * Reactions du membre sur une page entiere de contenus, en UNE requete.
 *
 * A utiliser dans un feed : `useReactionSummary` par ligne declencherait six
 * requetes par publication. Le total affiche vient de `reaction_count`, deja
 * present sur chaque ligne de `posts`.
 */
export function useMyReactions(
  targetType: TargetType,
  targetIds: string[],
): UseQueryResult<Map<string, ReactionType>> {
  const { user } = useAuth()
  // Les identifiants sont tries : deux rendus dans un ordre different doivent
  // partager la meme entree de cache.
  const signature = [...targetIds].sort().join('|')

  return useQuery({
    queryKey: [...qk.reactions(targetType, 'mine'), user?.id ?? 'anonyme', signature],
    queryFn: () => getMyReactions(user?.id as string, targetType, targetIds),
    enabled: Boolean(user) && targetIds.length > 0,
    staleTime: 30 * 1000,
  })
}

/**
 * Pose, remplace ou retire la reaction du membre, avec mise a jour optimiste :
 * sur un reseau mobile lent, la pastille doit repondre immediatement. En cas
 * d'échec, l'etat precedent est restaure et l'erreur remonte a l'appelant.
 */
export function useToggleReaction(targetType: TargetType, targetId: string) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const key = [...qk.reactions(targetType, targetId), user?.id ?? 'anonyme']

  return useMutation<void, Error, ReactionType, { previous?: ReactionSummary }>({
    mutationFn: async (reaction) => {
      if (!user) throw new Error('Vous devez être connecte pour réagir.')
      const current = queryClient.getQueryData<ReactionSummary>(key)?.mine ?? null
      if (current === reaction) await removeReaction(user.id, targetType, targetId)
      else await setReaction(user.id, targetType, targetId, reaction)
    },

    onMutate: async (reaction) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ReactionSummary>(key)
      if (!previous) return {}

      const counts = { ...previous.counts }
      const next = previous.mine === reaction ? null : reaction

      if (previous.mine) counts[previous.mine] = Math.max(0, counts[previous.mine] - 1)
      if (next) counts[next] = counts[next] + 1

      const total = Object.values(counts).reduce((sum, value) => sum + value, 0)
      queryClient.setQueryData<ReactionSummary>(key, { counts, total, mine: next })

      return { previous }
    },

    onError: (_error, _reaction, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key })
      // Couvre aussi les lots `useMyReactions` du meme type de contenu.
      void queryClient.invalidateQueries({ queryKey: qk.reactions(targetType, 'mine') })
      // `reaction_count` est recalcule par un declencheur : le contenu suit.
      if (targetType === 'post') {
        void queryClient.invalidateQueries({ queryKey: qk.post(targetId) })
        void queryClient.invalidateQueries({ queryKey: qk.posts() })
      }
    },
  })
}
