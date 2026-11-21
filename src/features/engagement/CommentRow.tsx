import { Button, Icon, cx } from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import type { CommentItem } from '@/services/comments'
import { AuthorLine } from './AuthorLine'
import { CommentForm } from './CommentForm'
import { ReportButton } from './ReportButton'
import s from './CommentThread.module.css'

/** Marge de tolerance : `updated_at` vaut `created_at` a la creation. */
const EDITED_THRESHOLD_MS = 1000

function wasEdited(comment: CommentItem): boolean {
  const created = new Date(comment.created_at).getTime()
  const updated = new Date(comment.updated_at).getTime()
  if (Number.isNaN(created) || Number.isNaN(updated)) return false
  return updated - created > EDITED_THRESHOLD_MS
}

export interface CommentRowProps {
  comment: CommentItem
  /** 0 = racine, 1 = reponse. Le fil s'arrete volontairement a deux niveaux. */
  depth: 0 | 1
  /** `false` quand le contenu porteur n'accepte plus de commentaire. */
  canReply: boolean
  isEditing: boolean
  isReplying: boolean
  onStartEdit: () => void
  onStartReply: () => void
  onCancel: () => void
  onSubmitEdit: (body: string) => Promise<unknown>
  onSubmitReply: (body: string) => Promise<unknown>
  onDelete: () => void
}

export function CommentRow({
  comment,
  depth,
  canReply,
  isEditing,
  isReplying,
  onStartEdit,
  onStartReply,
  onCancel,
  onSubmitEdit,
  onSubmitReply,
  onDelete,
}: CommentRowProps) {
  const { user, isSuspended, isStaff } = useAuth()
  const isAuthor = Boolean(user && comment.author_id === user.id)

  // Un commentaire masque n'est visible que par son auteur et le staff
  // (policies `comments_read_own_staff`). On le signale au lieu de faire
  // croire que le message est publie.
  const hidden = comment.is_hidden

  return (
    <article className={cx(s.row, depth === 1 && s.reply)}>
      <AuthorLine
        author={comment.author}
        date={comment.created_at}
        size={depth === 1 ? 'sm' : 'md'}
        trailing={
          wasEdited(comment) ? <span className={s.edited}>modifie</span> : undefined
        }
      />

      {hidden ? (
        <p className={s.hidden} role="note">
          <Icon name="shield" size={16} className={s.hiddenIcon} />
          <span>
            Ce commentaire a ete masque par la moderation.
            {isAuthor || isStaff ? " Vous le voyez car vous en êtes l'auteur ou un membre du staff." : ''}
          </span>
        </p>
      ) : isEditing ? (
        <CommentForm
          compact
          autoFocus
          initialValue={comment.body}
          submitLabel="Enregistrer"
          placeholder="Modifier votre commentaire..."
          onSubmit={onSubmitEdit}
          onCancel={onCancel}
        />
      ) : (
        <p className={s.body}>{comment.body}</p>
      )}

      {!isEditing ? (
        <div className={s.actions}>
          {canReply && depth === 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onStartReply}
              iconLeft={<Icon name="comment" size={16} />}
            >
              Répondre
            </Button>
          ) : null}

          {isAuthor ? (
            <>
              {/* Un compte suspendu ne peut plus editer (policy update), mais
                  conserve le droit de supprimer (policy delete). */}
              {!isSuspended && !hidden ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onStartEdit}
                  iconLeft={<Icon name="edit" size={16} />}
                >
                  Modifier
                </Button>
              ) : null}

              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                iconLeft={<Icon name="trash" size={16} />}
              >
                Supprimer
              </Button>
            </>
          ) : (
            <ReportButton targetType="comment" targetId={comment.id} size="sm" withLabel />
          )}
        </div>
      ) : null}

      {isReplying ? (
        <div className={s.replyForm}>
          <CommentForm
            compact
            autoFocus
            submitLabel="Repondre"
            placeholder="Votre réponse..."
            onSubmit={onSubmitReply}
            onCancel={onCancel}
          />
        </div>
      ) : null}
    </article>
  )
}
