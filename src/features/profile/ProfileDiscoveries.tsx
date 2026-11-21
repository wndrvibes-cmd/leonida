import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  asBadgeTone, Badge, Button, Card, EmptyState, ErrorState, Icon, Skeleton,
} from '@/components/ui'
import { CategoryChip, useMapCategories } from '@/features/map'
import { VERIFICATION_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/format'
import { useAuthorMarkers } from './profileQueries'
import s from './ProfileDiscoveries.module.css'

export interface ProfileDiscoveriesProps {
  authorId: string
  name: string
  isSelf: boolean
}

/**
 * Decouvertes VALIDEES du membre, telles qu'elles apparaissent sur la carte.
 *
 * Le niveau de verification affiche est exactement celui de la base : seule
 * une decouverte `staff_verified` porte la mention « Verifiee LEONIDA ».
 */
export function ProfileDiscoveries({ authorId, name, isSelf }: ProfileDiscoveriesProps) {
  const markers = useAuthorMarkers(authorId)
  const categories = useMapCategories()

  const categoriesById = useMemo(
    () => new Map((categories.data ?? []).map((category) => [category.id, category])),
    [categories.data],
  )

  if (markers.isPending) {
    return (
      <div className={s.list} aria-busy="true">
        <Skeleton height={96} radius="lg" />
        <Skeleton height={96} radius="lg" />
      </div>
    )
  }

  if (markers.isError) {
    return (
      <ErrorState
        error={markers.error}
        title="Decouvertes indisponibles"
        onRetry={() => void markers.refetch()}
      />
    )
  }

  if (markers.data.length === 0) {
    return (
      <EmptyState
        illustration={<Icon name="compass" size={38} />}
        title={
          isSelf
            ? "Aucune de vos decouvertes n'est encore publiee"
            : `${name} n'a aucune decouverte publiee`
        }
        description={
          isSelf
            ? "Les decouvertes que vous proposez apparaissent ici une fois validees par l'equipe. Le suivi de vos propositions en attente se trouve sur la carte, onglet « Mes contributions »."
            : "Seules les decouvertes validees par l'equipe apparaissent sur un profil."
        }
        action={
          isSelf ? (
            <Button as="link" to="/carte" variant="secondary" iconLeft={<Icon name="map" size={18} />}>
              Proposer une decouverte
            </Button>
          ) : undefined
        }
      />
    )
  }

  return (
    <ul className={s.list}>
      {markers.data.map((marker) => {
        const category = marker.category_id ? categoriesById.get(marker.category_id) ?? null : null
        const verification = VERIFICATION_LABELS[marker.verification]

        return (
          <Card key={marker.id} as="li" variant="flat" padding="md" className={s.item}>
            <div className={s.head}>
              <h3 className={s.title}>
                <Link to={`/carte?decouverte=${marker.id}`} className={s.link}>
                  {marker.title}
                </Link>
              </h3>
              <Badge tone={asBadgeTone(verification.tone)} size="sm" title={verification.help}>
                {verification.label}
              </Badge>
            </div>

            <div className={s.meta}>
              {category ? <CategoryChip category={category} /> : null}
              <span className={s.date}>
                Publiee le <time dateTime={marker.created_at}>{formatDate(marker.created_at)}</time>
              </span>
            </div>

            {marker.description?.trim() ? (
              <p className={s.excerpt}>{marker.description}</p>
            ) : null}

            {marker.author_tested ? (
              <p className={s.tested}>
                <Icon name="check" size={15} />
                L'auteur declare avoir teste cette decouverte lui-meme.
              </p>
            ) : null}
          </Card>
        )
      })}
    </ul>
  )
}
