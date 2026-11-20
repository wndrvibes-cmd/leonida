import type { ReactNode } from 'react'
import { Card, Icon, type IconName } from '@/components/ui'
import s from './PitchCard.module.css'

export interface PitchCardProps {
  icon: IconName
  heading: string
  description?: string | null
  /** Arguments reels, venus du reglage correspondant. */
  bullets?: string[]
  /** Precision honnete : indisponibilite, origine du visuel, limite connue. */
  note?: string | null
  /** Bouton principal. Absent si aucune action n'est reellement disponible. */
  action?: ReactNode
  /** Colonne de droite sur grand ecran : visuel, tarif, resume. */
  aside?: ReactNode
}

/**
 * Bloc de presentation d'une rubrique (carte, assistant, LEONIDA+).
 *
 * Il ne lit aucune donnee lui-meme : tout vient du reglage passe par la
 * section appelante, ce qui evite d'afficher un argumentaire invente.
 */
export function PitchCard({
  icon, heading, description, bullets, note, action, aside,
}: PitchCardProps) {
  return (
    <Card as="section" padding="lg" variant="raised" className={s.card}>
      <div className={s.main}>
        <span className={s.badge} aria-hidden="true">
          <Icon name={icon} size={22} />
        </span>

        <h3 className={s.heading}>{heading}</h3>
        {description ? <p className={s.description}>{description}</p> : null}

        {bullets && bullets.length > 0 ? (
          <ul className={s.list}>
            {bullets.map((item) => (
              <li key={item} className={s.item}>
                <Icon name="check" size={16} className={s.check} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {note ? (
          <p className={s.note}>
            <Icon name="info" size={16} />
            <span>{note}</span>
          </p>
        ) : null}

        {action ? <div className={s.actions}>{action}</div> : null}
      </div>

      {aside ? <div className={s.aside}>{aside}</div> : null}
    </Card>
  )
}
