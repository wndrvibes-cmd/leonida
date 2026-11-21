import { Link } from 'react-router-dom'
import { Badge, Icon } from '@/components/ui'
import {
  AuthorLine, CommentThread, FavoriteButton, ReactionBar, ShareButton,
} from '@/features/engagement'
import { POST_TYPE_LABELS } from '@/lib/constants'
import { formatCount, truncate } from '@/lib/format'
import type { PostListItem } from '@/services/posts'
import { PostGallery } from './PostGallery'
import { PostMenu } from './PostMenu'
import s from './PostDetail.module.css'

export interface PostDetailProps {
  post: PostListItem
  onEdit?: (post: PostListItem) => void
  onDelete?: (post: PostListItem) => void
}

/**
 * Publication complete.
 *
 * C'est ici — et seulement ici — que `<ReactionBar>` est montee : elle compte
 * reellement chaque type de reaction, au prix de plusieurs requetes, ce qui
 * n'a de sens que sur une page de detail (voir sa documentation).
 *
 * Le message est affiche en TEXTE BRUT, retours a la ligne conserves : aucun
 * HTML n'est interprete, et aucune mise en forme n'est devinee.
 */
export function PostDetail({ post, onEdit, onDelete }: PostDetailProps) {
  const title = post.title?.trim() ?? ''
  const heading = title || truncate(post.body, 70) || 'Publication sans titre'

  return (
    <article className={s.article}>
      {post.is_hidden ? (
        <p className={s.hidden} role="status">
          <Icon name="eye" size={18} />
          <span>
            Cette publication est masquee par la moderation : elle n'apparait plus dans
            le fil public.
            {post.hidden_reason ? ` Motif : ${post.hidden_reason}` : ''}
          </span>
        </p>
      ) : null}

      <header className={s.head}>
        <p className={s.kickers}>
          <Badge tone="accent" size="sm">
            {POST_TYPE_LABELS[post.post_type]}
          </Badge>
          {post.is_pinned ? (
            <Badge tone="neutral" size="sm" icon={<Icon name="pin" size={12} />}>
              Epinglee par l'équipe
            </Badge>
          ) : null}
        </p>

        <h1 className={s.title}>{heading}</h1>

        <AuthorLine
          author={post.author}
          date={post.created_at}
          trailing={
            <PostMenu
              post={post}
              size="md"
              onEdit={onEdit ? () => onEdit(post) : undefined}
              onDelete={onDelete ? () => onDelete(post) : undefined}
            />
          }
        />
      </header>

      {post.body ? <div className={s.body}>{post.body}</div> : null}

      {post.media.length > 0 ? (
        <section className={s.media} aria-label="Medias de la publication">
          <PostGallery media={post.media} variant="full" />
        </section>
      ) : null}

      {post.tags.length > 0 ? (
        <ul className={s.tags}>
          {post.tags.map((tag) => (
            <li key={tag}>
              <Link className={s.tag} to={`/communaute?tag=${encodeURIComponent(tag)}`}>
                #{tag}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <section className={s.engagement} aria-label="Reactions et partage">
        <ReactionBar targetType="post" targetId={post.id} />

        <div className={s.engagementActions}>
          <FavoriteButton targetType="post" targetId={post.id} withLabel />
          <ShareButton
            url={`/communaute/${post.id}`}
            title={heading}
            text={post.body ? truncate(post.body, 120) : undefined}
            withLabel
          />
        </div>
      </section>

      <section className={s.comments}>
        <CommentThread
          targetType="post"
          targetId={post.id}
          title={
            post.comment_count > 0
              ? `Commentaires (${formatCount(post.comment_count)})`
              : 'Commentaires'
          }
        />
      </section>
    </article>
  )
}
