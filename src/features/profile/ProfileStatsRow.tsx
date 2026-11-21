import { ErrorState, Icon, Skeleton, type IconName } from '@/components/ui'
import { formatCount } from '@/lib/format'
import type { ProfileStats } from '@/services/profiles'
import s from './ProfileStatsRow.module.css'

export interface ProfileStatsRowProps {
  stats: ProfileStats | undefined
  isPending: boolean
  isError: boolean
  error: unknown
  onRetry: () => void
}

interface Tile {
  key: string
  icon: IconName
  label: string
  /** `null` = information indisponible pour ce visiteur : on affiche « — ». */
  value: number | null
  help?: string
}

/**
 * Quatre compteurs REELS, obtenus par `count: 'exact'` cote base
 * (`getProfileStats`). Aucun chiffre n'est estime, aucun total n'est arrondi
 * a la hausse, et une valeur indisponible s'affiche « — » avec son
 * explication plutot qu'un zero trompeur.
 */
export function ProfileStatsRow({ stats, isPending, isError, error, onRetry }: ProfileStatsRowProps) {
  if (isPending) {
    return (
      <div className={s.grid} aria-busy="true">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className={s.tile}>
            <Skeleton width={64} height="1.6rem" />
            <Skeleton width="80%" height="0.85rem" />
          </div>
        ))}
      </div>
    )
  }

  if (isError || !stats) {
    return (
      <ErrorState
        compact
        error={error}
        title="Statistiques indisponibles"
        description="Les compteurs n'ont pas pu être lus. Rien n'est affiche plutôt qu'un chiffre approximatif."
        onRetry={onRetry}
      />
    )
  }

  const tiles: Tile[] = [
    { key: 'posts', icon: 'community', label: 'Publications', value: stats.posts },
    { key: 'moments', icon: 'moments', label: 'Moments', value: stats.moments },
    {
      key: 'proposed',
      icon: 'compass',
      label: 'Découvertes proposees',
      value: stats.markersProposed,
      help:
        stats.markersProposed === null
          ? "Ce total inclut des contributions non publiques : il n'est visible que par le membre lui-même et par l'équipe."
          : undefined,
    },
    { key: 'approved', icon: 'check', label: 'Découvertes validées', value: stats.markersApproved },
  ]

  return (
    <dl className={s.grid}>
      {tiles.map((tile) => (
        <div key={tile.key} className={s.tile}>
          <dt className={s.label}>
            <Icon name={tile.icon} size={15} className={s.icon} />
            {tile.label}
          </dt>
          <dd className={s.valueSlot}>
            <span className={s.value}>
              {tile.value === null ? (
                <>
                  <span aria-hidden="true">—</span>
                  <span className="sr-only">Indisponible</span>
                </>
              ) : (
                formatCount(tile.value)
              )}
            </span>
            {tile.help ? <span className={s.help}>{tile.help}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  )
}
