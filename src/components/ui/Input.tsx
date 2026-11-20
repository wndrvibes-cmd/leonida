import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { Field, fieldIds } from './Field'
import { cx } from './cx'
import s from './Input.module.css'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string
  hint?: string
  error?: string | null
  iconLeft?: ReactNode
  /** Element colle a droite du champ : bouton « voir », unite, raccourci. */
  addonRight?: ReactNode
  /** Classe appliquee a l'element <input>. */
  className?: string
  /** Classe appliquee au bloc complet (label + champ + aide). */
  fieldClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, iconLeft, addonRight, className, fieldClassName, id, required, ...rest },
  ref,
) {
  const autoId = useId()
  const ids = fieldIds(id ?? autoId, {
    hint: Boolean(hint) && !error,
    error: Boolean(error),
    extra: rest['aria-describedby'],
  })

  return (
    <Field
      ids={ids}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={fieldClassName}
    >
      <div className={cx(s.shell, error && s.shellError, rest.disabled && s.shellDisabled)}>
        {iconLeft ? (
          <span className={s.icon} aria-hidden="true">
            {iconLeft}
          </span>
        ) : null}
        <input
          {...rest}
          ref={ref}
          id={ids.inputId}
          required={required}
          className={cx(s.input, className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={ids.describedBy}
        />
        {addonRight ? <span className={s.addon}>{addonRight}</span> : null}
      </div>
    </Field>
  )
})
