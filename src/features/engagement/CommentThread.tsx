import { useState } from 'react'
import { ConfirmDialog, EmptyState, ErrorState, Icon, Skeleton, cx, useToast } from '@/components/ui'
import {
  useComments, useCreateComment, useDeleteComment, useUpdateComment,
} from '@/hooks/useComments'
import { readableError } from '@/lib/supabase'
import type { CommentItem } from '@/services/comments'
import { CommentForm } from './CommentForm'
import { CommentRow } from './CommentRow'
import type { TargetType } from './types'
import s from './CommentThread.module.css'

type Mode = { kind: 'idle' } | { kind: 'edit'; id: string } | { kind: 'reply'; id: string }

export interface CommentThreadProps {
  targetType: TargetType
  targetId: string
  /**
   * `false` ferme la discussion : le fil reste lisible, la saisie disparait.
   * Alimente par `news_articles.allow_comments` cote actualites.
   */
  allowComments?: boolean
  title?: string
  className?: string
}

/**
 * Fil de commentaires, deux niveaux au maximum.
 *
 * L'aplatissement est fait par `listComments()` : une reponse de reponse est
 * rattachee a sa RACINE. On n'imbrique donc jamais plus d'un cran, ce qui
 * garde le fil lisible sur iPhone sans perdre un seul message.
 */
export function CommentThread({
  targetType,
  targetId,
  allowComments = true,
  title = 'Commentaires',
  className,
}: CommentThreadProps) {
  const toast = useToast()
  const [mode, setMode] = useState<Mode>({ kind: 'idle' })
  const [toDelete, setToDelete] = useState<CommentItem | null>(null)

  const thread = useComments(targetType, targetId)
  const create = useCreateComment(targetType, targetId)
  const update = useUpdateComment(targetType, targetId)
  const remove = useDeleteComment(targetType, targetId)

  const idle = () => setMode({ kind: 'idle' })

  async function submitRoot(body: string) {
    await create.mutateAsync({ body })
  }

  async function submitReply(parentId: string, body: string) {
    await create.mutateAsync({ body, parentId })
    idle()
  }

  async function submitEdit(id: string, body: string) {
    await update.mutateAsync({ id, body })
    idle()
  }

  function confirmDelete() {
    const target = toDelete
    if (!target) return

    remove.mutate(target.id, {
      onSuccess: () => {
        setToDelete(null)
        idle()
        toast.success('Commentaire supprime')
      },
      onError: (deleteError) => {
        setToDelete(null)
        toast.error('Suppression impossible', readableError(deleteError))
      },
    })
  }

  const tree = thread.data

  return (
    <section className={cx(s.wrap, className)} aria-labelledby={`${targetId}-comments`}>
      <header className={s.head}>
        <h2 className={s.title} id={`${targetId}-comments`}>
          <Icon name="comment" size={20} className={s.titleIcon} />
          {title}
          {tree ? <span className={s.count}>{tree.total}</span> : null}
        </h2>
      </header>

      {allowComments ? (
        <CommentForm onSubmit={submitRoot} placeholder="Partager votre avis..." />
      ) : (
        <p className={s.closed} role="note">
          <Icon name="lock" size={16} className={s.closedIcon} />
          <span>Les commentaires sont fermes sur ce contenu.</span>
        </p>
      )}

      {thread.isLoading ? (
        <div className={s.list} aria-busy="true">
          {[0, 1, 2].map((key) => (
            <div key={key} className={s.row}>
              <Skeleton width="40%" height={20} radius="md" />
              <Skeleton lines={2} />
            </div>
          ))}
        </div>
      ) : thread.isError ? (
        <ErrorState
          error={thread.error}
          title="Commentaires indisponibles"
          onRetry={() => void thread.refetch()}
        />
      ) : !tree || tree.roots.length === 0 ? (
        <EmptyState
          compact
          title="Aucun commentaire pour l'instant"
          description={
            allowComments
              ? 'Ouvrez la discussion : le premier message donne souvent le ton.'
              : "Aucun message n'a ete publie avant la fermeture des commentaires."
          }
        />
      ) : (
        <div className={s.list}>
          {tree.roots.map((root) => (
            <div key={root.id} className={s.group}>
              <CommentRow
                comment={root}
                depth={0}
                canReply={allowComments}
                isEditing={mode.kind === 'edit' && mode.id === root.id}
                isReplying={mode.kind === 'reply' && mode.id === root.id}
                onStartEdit={() => setMode({ kind: 'edit', id: root.id })}
                onStartReply={() => setMode({ kind: 'reply', id: root.id })}
                onCancel={idle}
                onSubmitEdit={(body) => submitEdit(root.id, body)}
                onSubmitReply={(body) => submitReply(root.id, body)}
                onDelete={() => setToDelete(root)}
              />

              {root.replies.length > 0 ? (
                <div className={s.replies}>
                  {root.replies.map((reply) => (
                    <CommentRow
                      key={reply.id}
                      comment={reply}
                      depth={1}
                      canReply={false}
                      isEditing={mode.kind === 'edit' && mode.id === reply.id}
                      isReplying={false}
                      onStartEdit={() => setMode({ kind: 'edit', id: reply.id })}
                      onStartReply={idle}
                      onCancel={idle}
                      onSubmitEdit={(body) => submitEdit(reply.id, body)}
                      onSubmitReply={(body) => submitReply(root.id, body)}
                      onDelete={() => setToDelete(reply)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ))}

          {tree.truncated ? (
            <p className={s.truncated} role="note">
              Seuls les premiers commentaires sont affiches. La discussion se poursuit
              au-dela de ce que cette page charge.
            </p>
          ) : null}
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Supprimer ce commentaire ?"
        message="Le commentaire sera definitivement retire de la discussion. Cette action est irreversible."
        confirmLabel="Supprimer"
        tone="danger"
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </section>
  )
}
