import { asBadgeTone, Badge, Icon } from '@/components/ui'
import { RELIABILITY_LABELS } from '@/lib/constants'
import type { Database } from '@/types/database'
import s from './ReliabilityBadge.module.css'

type Reliability = Database['public']['Enums']['reliability']

export interface ReliabilityBadgeProps {
  reliability: Reliability
  size?: 'sm' | 'md'
  /** Ajoute la phrase d'explication sous le badge (page article). */
  withHelp?: boolean
  className?: string
}

/**
 * Niveau de fiabilite d'une actualite.
 *
 * Le libelle, le ton et l'explication viennent tous de `RELIABILITY_LABELS` :
 * une rumeur est TOUJOURS annoncee comme telle, et elle porte en plus une
 * icone d'alerte pour ne pas dependre de la seule couleur.
 */
export function ReliabilityBadge({
  reliability,
  size = 'md',
  withHelp = false,
  className,
}: ReliabilityBadgeProps) {
  const meta = RELIABILITY_LABELS[reliability]
  const isRumor = reliability === 'rumor'

  return (
    <span className={className}>
      <Badge
        tone={asBadgeTone(meta.tone)}
        size={size}
        title={meta.help}
        icon={isRumor ? <Icon name="alert" size={size === 'sm' ? 12 : 14} /> : undefined}
      >
        {meta.label}
      </Badge>

      {withHelp ? <span className={s.help}>{meta.help}</span> : null}
    </span>
  )
}
