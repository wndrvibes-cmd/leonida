import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { qk } from '@/lib/queryKeys'
import { useAuth } from '@/app/AuthProvider'
import {
  createComment, deleteComment, listComments, updateComment, type CommentTree,
} from '@/services/comments'
import type { Database } from '@/types/database'

type TargetType = Database['public']['Enums']['target_type']

export function useComments(
  targetType: TargetType,
  targetId: string | null | undefined,
): UseQueryResult<CommentTree> {
  return useQuery({
    queryKey: qk.comments(targetType, targetId ?? ''),
    queryFn: () => listComments(targetType, targetId as string),
    enabled: Boolean(targetId),
  })
}

/**
 * Invalide le fil ET le contenu porteur : `comment_count` est un compteur
 * denormalise recalcule par un declencheur cote base, le cache du contenu est
 * donc perime lui aussi.
 */
function useCommentInvalidation(targetType: TargetType, targetId: string) {
  const queryClient = useQueryClient()

  return () => {
    void queryClient.invalidateQueries({ queryKey: qk.comments(targetType, targetId) })
    if (targetType === 'post') {
      void queryClient.invalidateQueries({ queryKey: qk.post(targetId) })
      void queryClient.invalidateQueries({ queryKey: qk.posts() })
    }
  }
}

export function useCreateComment(targetType: TargetType, targetId: string) {
  const { user } = useAuth()
  const invalidate = useCommentInvalidation(targetType, targetId)

  return useMutation({
    mutationFn: (input: { body: string; parentId?: string | null }) => {
      if (!user) throw new Error('Vous devez être connecte pour commenter.')
      return createComment({
        authorId: user.id,
        targetType,
        targetId,
        parentId: input.parentId ?? null,
        body: input.body,
      })
    },
    onSuccess: invalidate,
  })
}

export function useUpdateComment(targetType: TargetType, targetId: string) {
  const invalidate = useCommentInvalidation(targetType, targetId)

  return useMutation({
    mutationFn: (input: { id: string; body: string }) => updateComment(input.id, input.body),
    onSuccess: invalidate,
  })
}

export function useDeleteComment(targetType: TargetType, targetId: string) {
  const invalidate = useCommentInvalidation(targetType, targetId)

  return useMutation({
    mutationFn: (id: string) => deleteComment(id),
    onSuccess: invalidate,
  })
}
