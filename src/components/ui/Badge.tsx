import type { ReactNode } from 'react'
import { cx } from './cx'
import s from './Badge.module.css'

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'premium'
export type BadgeSize = 'sm' | 'md'

const TONES: readonly BadgeTone[] = ['neutral', 'accent', 'success', 'warning', 'danger', 'premium']

/**
 * Les libelles de `@/lib/constants` exposent leur ton en `string`
 * (RELIABILITY_LABELS, VERIFICATION_LABELS...). Ce garde-fou evite un `as`
 * hasardeux dans chaque module appelant.
 */
export function asBadgeTone(tone: string | null | undefined): BadgeTone {
  return TONES.includes(tone as BadgeTone) ? (tone as BadgeTone) : 'neutral'
}

export interface BadgeProps {
  tone?: BadgeTone
  size?: BadgeSize
  icon?: ReactNode
  /** Ajoute un point de couleur a gauche (statut en direct, file d'attente). */
  dot?: boolean
  className?: string
  children: ReactNode
  title?: string
}

export function Badge({ tone = 'neutral', size = 'md', icon, dot, className, children, title }: BadgeProps) {
  return (
    <span className={cx(s.badge, s[tone], s[size], className)} title={title}>
      {dot ? <span className={s.dot} aria-hidden="true" /> : null}
      {icon ? <span className={s.icon}>{icon}</span> : null}
      <span className={s.text}>{children}</span>
    </span>
  )
}
