import type { ReactNode } from 'react'
import { Icon, type IconName } from '@/components/ui'
import s from './SettingsSection.module.css'

export interface SettingsSectionProps {
  title: string
  description?: ReactNode
  icon?: IconName
  /** Bloc d'actions aligne a droite du titre (desktop) ou dessous (mobile). */
  action?: ReactNode
  /** Precision affichee en pied de section : limite reelle, consequence... */
  footnote?: ReactNode
  children: ReactNode
}

/**
 * Panneau de reglages : meme en-tete, meme respiration, meme pied de page
 * pour tous les onglets des parametres.
 */
export function SettingsSection({
  title,
  description,
  icon,
  action,
  footnote,
  children,
}: SettingsSectionProps) {
  return (
    <section className={s.section}>
      <header className={s.head}>
        <div className={s.headText}>
          <h2 className={s.title}>
            {icon ? <Icon name={icon} size={18} className={s.icon} /> : null}
            {title}
          </h2>
          {description ? <p className={s.description}>{description}</p> : null}
        </div>
        {action ? <div className={s.action}>{action}</div> : null}
      </header>

      <div className={s.body}>{children}</div>

      {footnote ? <p className={s.footnote}>{footnote}</p> : null}
    </section>
  )
}
