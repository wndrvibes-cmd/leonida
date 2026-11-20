import {
  asBadgeTone, Badge, EmptyState, ErrorState, Icon, Skeleton,
} from '@/components/ui'
import {
  CommentThread, FavoriteButton, ReactionBar, ReportButton, ShareButton, AuthorLine,
} from '@/features/engagement'
import { MARKER_STATUS_LABELS, VERIFICATION_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/format'
import type { MapCategory } from '@/services/map'
import { CategoryChip } from './CategoryChip'
import { useMarker } from './useMapQueries'
import s from './MarkerDetail.module.css'

/**
 * Fiche d'une decouverte. Le meme contenu sert la feuille mobile et le
 * panneau lateral desktop : seule la coquille change, dans `MapPage`.
 *
 * La fiche recharge le marqueur par `getMarker(id)` plutot que de reutiliser
 * la ligne de la liste : c'est ce qui apporte l'auteur (hydrate separement,
 * voir `services/authors.ts`) et la version la plus a jour.
 *
 * HONNETETE — le niveau de verification est rendu par `VERIFICATION_LABELS`,
 * donc « Verifiee LEONIDA » n'apparait QUE pour `staff_verified`. Rien n'est
 * affiche par defaut : une decouverte non verifiee le dit.
 */

export interface MarkerDetailProps {
  markerId: string
  /** Categorie deja resolue par la liste : evite une requete de plus. */
  category: MapCategory | null
}

export function MarkerDetail({ markerId, category }: MarkerDetailProps) {
  const { data: marker, isPending, isError, error, refetch } = useMarker(markerId)

  if (isPending) {
    return (
      <div className={s.wrap}>
        <Skeleton height={180} radius="lg" />
        <Skeleton height={28} width="70%" />
        <Skeleton lines={4} />
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState
        error={error}
        title="Fiche indisponible"
        onRetry={() => { void refetch() }}
        compact
      />
    )
  }

  if (!marker) {
    return (
      <EmptyState
        title="Decouverte introuvable"
        description="Elle a peut-etre ete retiree, ou elle n'est pas encore validee."
        compact
      />
    )
  }

  const verification = VERIFICATION_LABELS[marker.verification]

  return (
    <div className={s.wrap}>
      {marker.image_url ? (
        <img className={s.cover} src={marker.image_url} alt={marker.title} loading="lazy" />
      ) : null}

      <div className={s.head}>
        <h2 className={s.title}>{marker.title}</h2>

        <div className={s.badges}>
          {category ? <CategoryChip category={category} /> : null}

          <Badge tone={asBadgeTone(verification.tone)} title={verification.help}>
            {verification.label}
          </Badge>

          {marker.is_official ? (
            <Badge
              tone="accent"
              icon={<Icon name="shield" size={14} />}
              title="Repere pose par l'equipe LEONIDA, et non propose par un membre."
            >
              Repere officiel
            </Badge>
          ) : null}

          {/* Visible uniquement par l'auteur ou le staff : la RLS ne renvoie
              une decouverte non validee a personne d'autre. */}
          {marker.status !== 'approved' ? (
            <Badge tone="warning" dot>
              {MARKER_STATUS_LABELS[marker.status]}
            </Badge>
          ) : null}
        </div>

        {marker.is_official ? (
          <p className={s.meta}>Ajoutee le {formatDate(marker.created_at)}</p>
        ) : (
          <AuthorLine author={marker.author} date={marker.created_at} size="sm" />
        )}
      </div>

      {marker.description ? <p className={s.body}>{marker.description}</p> : null}

      {marker.instructions ? (
        <section className={s.block}>
          <h3 className={s.blockTitle}>
            <Icon name="compass" size={16} />
            Comment s'y rendre
          </h3>
          <p className={s.blockBody}>{marker.instructions}</p>
        </section>
      ) : null}

      {marker.estimated_reward ? (
        <section className={s.block}>
          <h3 className={s.blockTitle}>
            <Icon name="coins" size={16} />
            Recompense estimee
          </h3>
          <p className={s.blockBody}>{marker.estimated_reward}</p>
          <p className={s.caveat}>
            Estimation annoncee par l'auteur, non verifiee par LEONIDA.
          </p>
        </section>
      ) : null}

      {marker.author_tested && marker.verification === 'unverified' ? (
        <p className={s.note}>
          <Icon name="info" size={16} />
          <span>
            L'auteur declare avoir teste cette decouverte lui-meme. Elle n'a pas encore
            ete confirmee par la communaute ni par l'equipe.
          </span>
        </p>
      ) : null}

      <div className={s.actions}>
        <FavoriteButton targetType="marker" targetId={marker.id} withLabel size="sm" />
        <ShareButton
          url={`/carte?decouverte=${marker.id}`}
          title={marker.title}
          text={marker.description ?? undefined}
          withLabel
          size="sm"
        />
        <ReportButton targetType="marker" targetId={marker.id} withLabel size="sm" />
      </div>

      <ReactionBar targetType="marker" targetId={marker.id} size="sm" />

      <CommentThread targetType="marker" targetId={marker.id} title="Retours de la communaute" />
    </div>
  )
}

export default MarkerDetail
