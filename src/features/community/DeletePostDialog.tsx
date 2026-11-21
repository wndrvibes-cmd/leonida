import { ConfirmDialog, useToast } from '@/components/ui'
import { readableError } from '@/lib/supabase'
import { truncate } from '@/lib/format'
import type { PostListItem } from '@/services/posts'
import { useDeleteCommunityPost } from './useCommunity'

export interface DeletePostDialogProps {
  /** Publication a supprimer. Le composant n'est monte que lorsqu'elle existe. */
  post: PostListItem
  onCancel: () => void
  /** Appele apres une suppression confirmee par la base. */
  onDeleted?: () => void
}

/**
 * Confirmation de suppression.
 *
 * La consequence est dite sans detour : la suppression emporte les
 * commentaires, reactions et favoris attaches (`on delete cascade`), et elle
 * est definitive.
 */
export function DeletePostDialog({ post, onCancel, onDeleted }: DeletePostDialogProps) {
  const toast = useToast()
  const remove = useDeleteCommunityPost(post.id)

  const label = post.title?.trim() || truncate(post.body, 60) || 'cette publication'

  return (
    <ConfirmDialog
      open
      title="Supprimer la publication ?"
      message={`« ${label} » sera definitivement supprimee, avec ses commentaires, ses reactions et les favoris qui la visent. Cette action est irreversible.`}
      confirmLabel="Supprimer"
      tone="danger"
      loading={remove.isPending}
      onCancel={remove.isPending ? () => undefined : onCancel}
      onConfirm={() =>
        remove.mutate(undefined, {
          onSuccess: () => {
            toast.success('Publication supprimee')
            onDeleted?.()
          },
          onError: (error) => toast.error('Suppression impossible', readableError(error)),
        })
      }
    />
  )
}
