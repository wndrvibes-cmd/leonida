import { Link } from 'react-router-dom'
import { Badge, Card, Icon, Skeleton, SkeletonAvatar } from '@/components/ui'
import { AuthorLine, FavoriteButton } from '@/features/engagement'
import { POST_TYPE_LABELS } from '@/lib/constants'
import { formatCount, truncate } from '@/lib/format'
import type { PostListItem } from '@/services/posts'
import type { Database } from '@/types/database'
import { PostGallery } from './PostGallery'
import { PostMenu } from './PostMenu'
import { PostReactions } from './PostReactions'
import s from './PostCard.module.css'

type ReactionType = Database['public']['Enums']['reaction_type']

export interface PostCardProps {
  post: PostListItem
  /** Reaction du membre, fournie par le lot unique de la page. */
  myReaction: ReactionType | null
  reactionsLoading?: boolean
  /** Filtre le fil sur un tag clique. */
  onTagSelect?: (tag: string) => void
  onEdit?: (post: PostListItem) => void
  onDelete?: (post: PostListItem) => void
}

/** Longueur de l'apercu : assez pour juger, assez court pour parcourir le fil. */
const PREVIEW_MAX = 260

/**
 * Carte de publication du fil communautaire.
 *
 * La carte n'est volontairement PAS cliquable dans son ensemble : elle contient
 * deja des liens (profil de l'auteur, discussion, tags) et des boutons, et
 * imbriquer des liens produirait un balisage invalide. Le titre porte le lien
 * vers la publication.
 *
 * Tous les chiffres viennent de la base : `reaction_count` et `comment_count`
 * sont maintenus par des declencheurs, rien n'est estime ici.
 */
export function PostCard({
  post,
  myReaction,
  reactionsLoading,
  onTagSelect,
  onEdit,
  onDelete,
}: PostCardProps) {
  const title = post.title?.trim() ?? ''
  const heading = title || truncate(post.body, 90) || 'Publication sans titre'
  const preview = title ? truncate(post.body, PREVIEW_MAX) : ''
  const href = `/communaute/${post.id}`

  return (
    <Card as="article" variant="raised" padding="md" className={s.card}>
      {/* `AuthorLine` place deja ses elements de droite dans une rangee flex :
          un conteneur supplementaire serait du bruit. */}
      <AuthorLine
        author={post.author}
        date={post.created_at}
        size="sm"
        className={s.author}
        trailing={
          <>
            {post.is_pinned ? (
              <Badge tone="accent" size="sm" icon={<Icon name="pin" size={12} />}>
                Epinglee
              </Badge>
            ) : null}
            <Badge tone="neutral" size="sm">
              {POST_TYPE_LABELS[post.post_type]}
            </Badge>
            <PostMenu
              post={post}
              onEdit={onEdit ? () => onEdit(post) : undefined}
              onDelete={onDelete ? () => onDelete(post) : undefined}
            />
          </>
        }
      />

      <h3 className={s.title}>
        <Link to={href} className={s.link}>
          {heading}
        </Link>
      </h3>

      {preview ? <p className={s.preview}>{preview}</p> : null}

      {post.media.length > 0 ? <PostGallery media={post.media} variant="compact" /> : null}

      {post.tags.length > 0 ? (
        <ul className={s.tags}>
          {post.tags.slice(0, 4).map((tag) => (
            <li key={tag}>
              {onTagSelect ? (
                <button
                  type="button"
                  className={s.tag}
                  onClick={() => onTagSelect(tag)}
                  aria-label={`Filtrer sur le tag ${tag}`}
                >
                  #{tag}
                </button>
              ) : (
                <span className={s.tagStatic}>#{tag}</span>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      <div className={s.footer}>
        <PostReactions
          postId={post.id}
          total={post.reaction_count}
          mine={myReaction}
          loading={reactionsLoading}
        />

        <div className={s.actions}>
          <Link to={href} className={s.comments}>
            <Icon name="comment" size={16} />
            {post.comment_count > 0 ? (
              <>
                {formatCount(post.comment_count)}
                <span className="sr-only">
                  commentaire{post.comment_count > 1 ? 's' : ''}
                </span>
              </>
            ) : (
              'Commenter'
            )}
          </Link>

          <FavoriteButton targetType="post" targetId={post.id} size="sm" />
        </div>
      </div>
    </Card>
  )
}

/** Carte fantome du premier chargement : meme rythme vertical que la vraie. */
export function PostCardSkeleton() {
  return (
    <Card as="article" variant="raised" padding="md" className={s.card}>
      <div className={s.skeletonHead}>
        <SkeletonAvatar size={32} />
        <Skeleton width="46%" height={12} />
      </div>
      <Skeleton width="70%" height={18} />
      <Skeleton lines={3} />
      <Skeleton width="100%" height={44} radius="full" />
    </Card>
  )
}
