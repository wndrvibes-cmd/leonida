import type { FocusEventHandler, MouseEventHandler, ReactNode } from 'react'
import { Link, type To } from 'react-router-dom'
import { Spinner } from './Spinner'
import { cx } from './cx'
import s from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'premium'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonOwnProps {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Remplace l'icone de gauche par un indicateur et neutralise les clics. */
  loading?: boolean
  disabled?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
  fullWidth?: boolean
  /** Bouton carre sans libelle : l'etiquette accessible devient obligatoire. */
  iconOnly?: boolean
  className?: string
  children?: ReactNode
  id?: string
  title?: string
  tabIndex?: number
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  'aria-controls'?: string
  'aria-haspopup'?: boolean | 'dialog' | 'menu' | 'listbox'
  'aria-current'?: boolean | 'page'
  'aria-pressed'?: boolean
}

interface ButtonAsButton extends ButtonOwnProps {
  as?: 'button'
  type?: 'button' | 'submit' | 'reset'
  name?: string
  value?: string
  form?: string
  autoFocus?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
  onFocus?: FocusEventHandler<HTMLButtonElement>
  onBlur?: FocusEventHandler<HTMLButtonElement>
}

interface ButtonAsLink extends ButtonOwnProps {
  /** Navigation interne : rend un <Link> de react-router. */
  as: 'link'
  to: To
  replace?: boolean
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

interface ButtonAsAnchor extends ButtonOwnProps {
  /** Lien sortant : rend un <a>. */
  as: 'a'
  href: string
  target?: '_blank' | '_self'
  rel?: string
  download?: boolean
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

export type ButtonProps = ButtonAsButton | ButtonAsLink | ButtonAsAnchor

function buildClassName(props: ButtonProps): string {
  const { variant = 'primary', size = 'md', fullWidth, iconOnly, loading, disabled, className } = props
  return cx(
    s.btn,
    s[variant],
    s[size],
    fullWidth && s.full,
    iconOnly && s.iconOnly,
    loading && s.isLoading,
    disabled && s.isDisabled,
    className,
  )
}

export function Button(props: ButtonProps) {
  const { size = 'md', loading = false, disabled = false, iconLeft, iconRight, children } = props
  const className = buildClassName(props)
  const spinnerSize = size === 'lg' ? 'md' : 'sm'

  const content = (
    <>
      {loading ? (
        <Spinner size={spinnerSize} silent className={s.slot} />
      ) : iconLeft ? (
        <span className={s.slot}>{iconLeft}</span>
      ) : null}
      {children ? <span className={s.label}>{children}</span> : null}
      {!loading && iconRight ? <span className={s.slot}>{iconRight}</span> : null}
    </>
  )

  const shared = {
    className,
    id: props.id,
    title: props.title,
    tabIndex: props.tabIndex,
    'aria-label': props['aria-label'],
    'aria-labelledby': props['aria-labelledby'],
    'aria-describedby': props['aria-describedby'],
    'aria-expanded': props['aria-expanded'],
    'aria-controls': props['aria-controls'],
    'aria-haspopup': props['aria-haspopup'],
    'aria-current': props['aria-current'],
    'aria-pressed': props['aria-pressed'],
  }

  // Un lien desactive reste un lien : on le neutralise au clavier comme a la
  // souris plutot que de changer sa nature au milieu d'une mise en page.
  const inert = disabled || loading

  if (props.as === 'link') {
    if (inert) {
      return (
        <span {...shared} role="link" aria-disabled="true">
          {content}
        </span>
      )
    }
    return (
      <Link {...shared} to={props.to} replace={props.replace} onClick={props.onClick}>
        {content}
      </Link>
    )
  }

  if (props.as === 'a') {
    if (inert) {
      return (
        <span {...shared} role="link" aria-disabled="true">
          {content}
        </span>
      )
    }
    return (
      <a
        {...shared}
        href={props.href}
        target={props.target}
        rel={props.target === '_blank' ? (props.rel ?? 'noreferrer noopener') : props.rel}
        download={props.download}
        onClick={props.onClick}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      {...shared}
      type={props.type ?? 'button'}
      name={props.name}
      value={props.value}
      form={props.form}
      autoFocus={props.autoFocus}
      disabled={inert}
      aria-busy={loading || undefined}
      onClick={props.onClick}
      onFocus={props.onFocus}
      onBlur={props.onBlur}
    >
      {content}
    </button>
  )
}
