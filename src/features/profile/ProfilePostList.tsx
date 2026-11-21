import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Badge, Button, Card, EmptyState, ErrorState, Icon, Skeleton,
} from '@/components/ui'
import { CoverArt } from '@/features/home'
import { POST_TYPE_LABELS } from '@/lib/constants'
import { formatCount, relativeTime, truncate } from '@/lib/format'
import type { Database } from '@/types/database'
import { useAuthorPosts, type AuthorPost } from './profileQueries'
import s from './ProfilePostList.module.css'

type PostSurface = Database['public']['Enums']['post_surface']

export interface ProfilePostListProps {
  authorId: string
  surface: PostSurface
  /** Nom affiche du membre : sert a formuler l'etat vide a la 3e personne. */
  name: string
  isSelf: boolean
}

/** Premiere image reellement disponible : une video n'a pas de vignette. */
function firstImage(entry: AuthorPost): string | null {
  const image = entry.media.find((item) => item.kind === 'image')
  return image?.url ?? null
}

/**
 * Publications d'un membre, sur la surface demandee.
 *
 *   - `community` : liste lisible, le titre d'abord ;
 *   - `moment`    : grille de vignettes, le visuel d'abord.
 *
 * Les compteurs proviennent des colonnes `reaction_count` / `comment_count`
 * maintenues par la base. La ligne d'auteur est volontairement absente : sur
 * un profil, l'auteur est déjà connu, la repeter n'apporterait rien.
 */
export function ProfilePostList({ authorId, surface, name, isSelf }: ProfilePostListProps) {
  const query = useAuthorPosts(authorId, surface)
  const isMoment = surface === 'moment'

  const entries = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => page.items),
    [query.data],
  )

  if (query.isPending) {
    return (
      <div className={isMoment ? s.grid : s.list} aria-busy="true">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} height={isMoment ? 170 : 104} radius="lg" />
        ))}
      </div>
    )
  }

  if (query.isError && entries.length === 0) {
    return (
      <ErrorState
        error={query.error}
        title={isMoment ? 'Moments indisponibles' : 'Publications indisponibles'}
        onRetry={() => void query.refetch()}
      />
    )
  }

  if (entries.length === 0) {
    return isMoment ? (
      <EmptyState
        illustration={<Icon name="moments" size={38} />}
        title={isSelf ? "Vous n'avez partage aucun moment" : `${name} n'a partage aucun moment`}
        description={
          isSelf
            ? 'Une capture, une scene, un instant de Leonida : vos moments apparaîtront ici.'
            : "Rien n'a encore été partage sur cette surface."
        }
        action={
          isSelf ? (
            <Button as="link" to="/moments" variant="secondary" iconLeft={<Icon name="plus" size={18} />}>
              Partager un moment
            </Button>
          ) : undefined
        }
      />
    ) : (
      <EmptyState
        illustration={<Icon name="community" size={38} />}
        title={isSelf ? "Vous n'avez rien publié" : `${name} n'a rien publié pour l'instant`}
        description={
          isSelf
            ? 'Vos discussions, astuces et questions apparaîtront ici des votre première publication.'
            : "Aucune publication visible sur ce profil pour le moment."
        }
        action={
          isSelf ? (
            <Button as="link" to="/communaute" variant="secondary" iconLeft={<Icon name="plus" size={18} />}>
              Lancer une discussion
            </Button>
          ) : undefined
        }
      />
    )
  }

  return (
    <div className={s.wrap}>
      {isMoment ? (
        <ul className={s.grid}>
          {entries.map((entry) => {
            const caption = entry.post.title?.trim() || truncate(entry.post.body, 60)
            const image = firstImage(entry)

            return (
              <li key={entry.post.id} className={s.tile}>
                <Link
                  to={`/communaute/${entry.post.id}`}
                  className={s.tileLink}
                  aria-label={caption || 'Voir le moment'}
                >
                  <CoverArt
                    src={image}
                    alt={caption}
                    seed={entry.post.id}
                    icon={entry.media.length > 0 ? 'play' : 'moments'}
                    ratio="square"
                  />
                </Link>
                <p className={s.tileMeta}>
                  <span className={s.count}>
                    <Icon name="fire" size={13} />
                    <span className="sr-only">Réactions :</span>
                    {formatCount(entry.post.reaction_count)}
                  </span>
                  <span className={s.count}>
                    <Icon name="comment" size={13} />
                    <span className="sr-only">Commentaires :</span>
                    {formatCount(entry.post.comment_count)}
                  </span>
                </p>
              </li>
            )
          })}
        </ul>
      ) : (
        <ul className={s.list}>
          {entries.map((entry) => {
            const heading = entry.post.title?.trim() || truncate(entry.post.body, 80) || 'Publication'
            const preview = entry.post.title?.trim() ? truncate(entry.post.body, 120) : ''
            const image = firstImage(entry)

            return (
              <Card key={entry.post.id} as="li" variant="flat" padding="md" className={s.row}>
                {/* Vignette purement illustrative : le titre porte deja le lien,
                    deux liens vers la meme cible alourdiraient la navigation. */}
                {image ? (
                  <span className={s.thumb}>
                    <CoverArt src={image} alt="" seed={entry.post.id} ratio="square" />
                  </span>
                ) : null}

                <div className={s.rowBody}>
                  <div className={s.rowHead}>
                    <h3 className={s.rowTitle}>
                      <Link to={`/communaute/${entry.post.id}`} className={s.rowLink}>
                        {heading}
                      </Link>
                    </h3>
                    <Badge tone="neutral" size="sm">
                      {POST_TYPE_LABELS[entry.post.post_type]}
                    </Badge>
                    {entry.post.is_pinned ? (
                      <Badge tone="accent" size="sm" icon={<Icon name="pin" size={12} />}>
                        Epinglee
                      </Badge>
                    ) : null}
                  </div>

                  {preview ? <p className={s.rowPreview}>{preview}</p> : null}

                  <p className={s.rowMeta}>
                    <time dateTime={entry.post.created_at}>{relativeTime(entry.post.created_at)}</time>
                    <span className={s.count}>
                      <Icon name="fire" size={13} />
                      <span className="sr-only">Réactions :</span>
                      {formatCount(entry.post.reaction_count)}
                    </span>
                    <span className={s.count}>
                      <Icon name="comment" size={13} />
                      <span className="sr-only">Commentaires :</span>
                      {formatCount(entry.post.comment_count)}
                    </span>
                  </p>
                </div>
              </Card>
            )
          })}
        </ul>
      )}

      {query.isError ? (
        <ErrorState
          compact
          error={query.error}
          title="La suite n'a pas pu être chargée"
          onRetry={() => void query.fetchNextPage()}
          retryLabel="Reessayer"
        />
      ) : null}

      {query.hasNextPage ? (
        <div className={s.more}>
          <Button
            variant="secondary"
            onClick={() => void query.fetchNextPage()}
            loading={query.isFetchingNextPage}
            iconLeft={<Icon name="chevron-down" size={18} />}
          >
            Voir plus
          </Button>
        </div>
      ) : null}
    </div>
  )
}
