import type { ElementType, MouseEventHandler, ReactNode } from 'react'
import { Link, type To } from 'react-router-dom'
import { cx } from './cx'
import s from './Card.module.css'

export type CardVariant = 'flat' | 'raised' | 'interactive'
export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps {
  variant?: CardVariant
  padding?: CardPadding
  /** Balise de rendu quand la carte n'est ni un lien ni un bouton. */
  as?: 'div' | 'article' | 'section' | 'li' | 'aside'
  /** Rend un <Link> : la carte entiere devient cliquable. */
  to?: To
  onClick?: MouseEventHandler<HTMLElement>
  className?: string
  children?: ReactNode
  id?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}

export function Card({
  variant = 'flat',
  padding = 'md',
  as = 'div',
  to,
  onClick,
  className,
  children,
  id,
  ...aria
}: CardProps) {
  const isAction = Boolean(to) || Boolean(onClick)
  const resolved: CardVariant = isAction && variant === 'flat' ? 'interactive' : variant
  const classes = cx(s.card, s[resolved], s[`pad-${padding}`], className)

  if (to) {
    return (
      <Link className={classes} to={to} id={id} {...aria}>
        {children}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button className={classes} type="button" onClick={onClick} id={id} {...aria}>
        {children}
      </button>
    )
  }

  const Tag: ElementType = as
  return (
    <Tag className={classes} id={id} {...aria}>
      {children}
    </Tag>
  )
}

/** En-tete de carte : titre + actions alignees a droite. */
export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cx(s.header, className)}>
      <div className={s.headerText}>
        <div className={s.title}>{title}</div>
        {subtitle ? <div className={s.subtitle}>{subtitle}</div> : null}
      </div>
      {action ? <div className={s.headerAction}>{action}</div> : null}
    </div>
  )
}
