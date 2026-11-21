import { Icon } from '@/components/ui'
import { RELIABILITY_LABELS } from '@/lib/constants'
import type { Database } from '@/types/database'
import { ReliabilityBadge } from './ReliabilityBadge'
import s from './ReliabilityLegend.module.css'

type Reliability = Database['public']['Enums']['reliability']

const ORDER = Object.keys(RELIABILITY_LABELS) as Reliability[]

/**
 * Explique les quatre niveaux de fiabilite, avec les textes de
 * `RELIABILITY_LABELS`. Replie par defaut : c'est une aide, pas du remplissage.
 */
export function ReliabilityLegend() {
  return (
    <details className={s.wrap}>
      <summary className={s.summary}>
        <Icon name="info" size={16} />
        <span>Comment lire les niveaux de fiabilité</span>
        <Icon name="chevron-down" size={16} className={s.chevron} />
      </summary>

      <dl className={s.list}>
        {ORDER.map((level) => (
          <div key={level} className={s.item}>
            <dt className={s.term}>
              <ReliabilityBadge reliability={level} size="sm" />
            </dt>
            <dd className={s.definition}>{RELIABILITY_LABELS[level].help}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
