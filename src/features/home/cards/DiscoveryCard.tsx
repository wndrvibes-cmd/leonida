import { Badge, Card, Icon, asBadgeTone, type IconName } from '@/components/ui'
import { VERIFICATION_LABELS } from '@/lib/constants'
import { relativeTime, truncate } from '@/lib/format'
import type { MapMarker } from '@/services/map'
import { CoverArt } from '../CoverArt'
import s from './DiscoveryCard.module.css'

export interface DiscoveryCardProps {
  marker: MapMarker
  categoryLabel?: string
  categoryIcon?: IconName
}

/**
 * Carte de decouverte (marqueur valide de la carte).
 *
 * Le niveau de verification affiche est EXACTEMENT celui de la base :
 * « Verifiee LEONIDA » n'apparait que pour `staff_verified`, pose par le staff.
 *
 * La carte mene a l'écran de la carte. Il n'existe pas encore d'adresse
 * dediee a un marqueur : plutot qu'inventer un paramètre d'URL qui ne serait
 * lu par personne, on envoie vers la destination reelle.
 */
export function DiscoveryCard({ marker, categoryLabel, categoryIcon }: DiscoveryCardProps) {
  const verification = VERIFICATION_LABELS[marker.verification]

  return (
    <Card to="/carte" padding="none" className={s.card}>
      <CoverArt
        src={marker.image_url}
        seed={marker.id}
        icon={categoryIcon ?? 'map'}
        ratio="card"
        className={s.cover}
      />

      <div className={s.body}>
        <div className={s.meta}>
          <Badge tone={asBadgeTone(verification.tone)} size="sm" title={verification.help}>
            {verification.label}
          </Badge>
          {marker.is_official ? (
            <Badge tone="accent" size="sm" icon={<Icon name="shield" size={13} />}>
              Officielle
            </Badge>
          ) : null}
        </div>

        <h3 className={s.title}>{marker.title}</h3>

        {marker.description ? (
          <p className={s.description}>{truncate(marker.description, 110)}</p>
        ) : null}

        <p className={s.foot}>
          {categoryLabel ? (
            <span className={s.category}>
              <Icon name={categoryIcon ?? 'pin'} size={14} />
              {categoryLabel}
            </span>
          ) : null}
          <span className={s.date}>{relativeTime(marker.created_at)}</span>
        </p>
      </div>
    </Card>
  )
}
