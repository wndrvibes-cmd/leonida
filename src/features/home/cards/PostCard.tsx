import { Link } from 'react-router-dom'
import { Badge, Card, Icon } from '@/components/ui'
import { AuthorLine } from '@/features/engagement'
import { POST_TYPE_LABELS } from '@/lib/constants'
import { formatCount, truncate } from '@/lib/format'
import type { PostListItem } from '@/services/posts'
import s from './PostCard.module.css'

export interface PostCardProps {
  post: PostListItem
}

/**
 * Carte de publication communautaire.
 *
 * La carte n'est volontairement PAS cliquable dans son ensemble : la ligne
 * d'auteur contient deja un lien vers le profil, et imbriquer deux liens
 * produirait un balisage invalide. Le titre porte donc le lien vers la
 * discussion.
 *
 * Les compteurs viennent des colonnes `comment_count` / `reaction_count`
 * maintenues par la base : aucun chiffre n'est estime ici.
 */
export function PostCard({ post }: PostCardProps) {
  const heading = post.title?.trim() || truncate(post.body, 90) || 'Publication sans titre'
  const preview = post.title?.trim() ? truncate(post.body, 130) : ''

  return (
    <Card as="article" padding="md" variant="raised" className={s.card}>
      <AuthorLine
        author={post.author}
        date={post.created_at}
        size="sm"
        trailing={
          <Badge tone="neutral" size="sm">
            {POST_TYPE_LABELS[post.post_type]}
          </Badge>
        }
      />

      <h3 className={s.title}>
        <Link to={`/communaute/${post.id}`} className={s.link}>
          {heading}
        </Link>
      </h3>

      {preview ? <p className={s.preview}>{preview}</p> : null}

      {post.tags.length > 0 ? (
        <ul className={s.tags}>
          {post.tags.slice(0, 3).map((tag) => (
            <li key={tag} className={s.tag}>#{tag}</li>
          ))}
        </ul>
      ) : null}

      <p className={s.counts}>
        <span className={s.count}>
          <Icon name="fire" size={14} />
          <span className="sr-only">Reactions :</span>
          {formatCount(post.reaction_count)}
        </span>
        <span className={s.count}>
          <Icon name="comment" size={14} />
          <span className="sr-only">Commentaires :</span>
          {formatCount(post.comment_count)}
        </span>
        {post.media.length > 0 ? (
          <span className={s.count}>
            <Icon name="image" size={14} />
            <span className="sr-only">Medias :</span>
            {formatCount(post.media.length)}
          </span>
        ) : null}
      </p>
    </Card>
  )
}
