import { useId, type ReactNode } from 'react'
import { cx } from './cx'
import s from './Switch.module.css'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  /** Precision affichee sous le libelle (consequence du reglage). */
  description?: ReactNode
  disabled?: boolean
  /** Indique une sauvegarde en cours : l'interrupteur reste lisible mais inerte. */
  busy?: boolean
  id?: string
  className?: string
  'aria-label'?: string
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  busy = false,
  id,
  className,
  ...aria
}: SwitchProps) {
  const autoId = useId()
  const switchId = id ?? autoId
  const descriptionId = `${switchId}-description`
  const inert = disabled || busy

  const control = (
    <button
      type="button"
      role="switch"
      id={switchId}
      className={cx(s.track, checked && s.on, inert && s.inert)}
      aria-checked={checked}
      aria-label={aria['aria-label']}
      aria-describedby={description ? descriptionId : undefined}
      aria-busy={busy || undefined}
      disabled={inert}
      onClick={() => onChange(!checked)}
    >
      <span className={s.thumb} aria-hidden="true" />
    </button>
  )

  if (!label && !description) {
    return <span className={cx(s.bare, className)}>{control}</span>
  }

  return (
    <div className={cx(s.row, className)}>
      <div className={s.text}>
        {label ? (
          <label className={s.label} htmlFor={switchId}>
            {label}
          </label>
        ) : null}
        {description ? (
          <p className={s.description} id={descriptionId}>
            {description}
          </p>
        ) : null}
      </div>
      {control}
    </div>
  )
}
