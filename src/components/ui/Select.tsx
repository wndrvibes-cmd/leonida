import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from 'react'
import { Icon } from './Icon'
import { Field, fieldIds } from './Field'
import { cx } from './cx'
import s from './Select.module.css'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  label?: string
  hint?: string
  error?: string | null
  /** Liste d'options ; sinon fournir des <option> en enfants. */
  options?: SelectOption[]
  /** Premiere ligne non selectionnable (« Toutes les categories »). */
  placeholder?: string
  className?: string
  fieldClassName?: string
  children?: ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, options, placeholder, className, fieldClassName, id, required, children, ...rest },
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
        <select
          {...rest}
          ref={ref}
          id={ids.inputId}
          required={required}
          className={cx(s.select, className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={ids.describedBy}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options
            ? options.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))
            : children}
        </select>
        <Icon name="chevron-down" size={18} className={s.chevron} />
      </div>
    </Field>
  )
})
