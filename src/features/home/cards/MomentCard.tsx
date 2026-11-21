import { Link } from 'react-router-dom'
import { Card, Icon } from '@/components/ui'
import { AuthorLine } from '@/features/engagement'
import { formatCount, truncate } from '@/lib/format'
import type { PostListItem } from '@/services/posts'
import { CoverArt } from '../CoverArt'
import s from './MomentCard.module.css'

export interface MomentCardProps {
  moment: PostListItem
}

/**
 * Carte « moment » : le visuel d'abord.
 *
 * Une video n'a pas de vignette en base : on affiche alors le degrade de
 * repli avec une icone de lecture, plutot qu'une image choisie au hasard.
 *
 * Les compteurs restent HORS du lien (et ne captent pas le clic) pour qu'un
 * lecteur d'écran les annonce au lieu de les voir absorbes par l'etiquette
 * du lien.
 */
export function MomentCard({ moment }: MomentCardProps) {
  const first = moment.media[0]
  const isImage = first?.kind === 'image'
  const caption = moment.title?.trim() || truncate(moment.body, 70)

  return (
    <Card as="article" padding="none" variant="raised" className={s.card}>
      <div className={s.media}>
        <Link
          to={`/communaute/${moment.id}`}
          className={s.mediaLink}
          aria-label={caption || 'Voir le moment'}
        >
          <CoverArt
            src={isImage && first ? first.url : null}
            alt={first?.caption ?? ''}
            seed={moment.id}
            icon={first ? 'play' : 'moments'}
            ratio="square"
          />
        </Link>

        <p className={s.overlay}>
          <span className={s.count}>
            <Icon name="fire" size={14} />
            <span className="sr-only">Réactions :</span>
            {formatCount(moment.reaction_count)}
          </span>
          <span className={s.count}>
            <Icon name="comment" size={14} />
            <span className="sr-only">Commentaires :</span>
            {formatCount(moment.comment_count)}
          </span>
        </p>
      </div>

      <div className={s.body}>
        {caption ? <p className={s.caption}>{caption}</p> : null}
        <AuthorLine author={moment.author} date={moment.created_at} size="sm" />
      </div>
    </Card>
  )
}
