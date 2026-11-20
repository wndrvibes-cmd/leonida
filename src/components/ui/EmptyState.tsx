import type { ReactNode } from 'react'
import { cx } from './cx'
import s from './EmptyState.module.css'

export interface EmptyStateProps {
  title: string
  description?: string
  /** Remplace l'illustration par defaut (icone de la section, par exemple). */
  illustration?: ReactNode
  /** Bouton d'amorce : « Proposer une decouverte », « Lancer une discussion »... */
  action?: ReactNode
  /** Variante dense pour les colonnes etroites et les panneaux. */
  compact?: boolean
  className?: string
}

/**
 * Etat vide honnete : on n'invente jamais de contenu de remplissage.
 * L'illustration evoque l'horizon de Leonida (soleil, mer, rivage) sans
 * imiter une capture du jeu.
 */
export function EmptyState({
  title,
  description,
  illustration,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div className={cx(s.wrap, compact && s.compact, className)}>
      <div className={s.art}>{illustration ?? <HorizonArt />}</div>
      <h3 className={s.title}>{title}</h3>
      {description ? <p className={s.description}>{description}</p> : null}
      {action ? <div className={s.action}>{action}</div> : null}
    </div>
  )
}

function HorizonArt() {
  return (
    <svg viewBox="0 0 120 80" className={s.svg} aria-hidden="true" focusable="false">
      <circle className={s.sun} cx="60" cy="34" r="16" />
      <path className={s.horizon} d="M8 50h104" />
      <path className={s.wave} d="M14 60c7-4 13-4 20 0s13 4 20 0 13-4 20 0 13 4 20 0" />
      <path className={s.wave} d="M22 70c6-3 11-3 17 0s11 3 17 0 11-3 17 0" />
      <rect className={s.frame} x="10" y="10" width="100" height="60" rx="8" />
    </svg>
  )
}
