import {
  forwardRef,
  useId,
  useState,
  type ChangeEvent,
  type TextareaHTMLAttributes,
} from 'react'
import { Field, fieldIds } from './Field'
import { cx } from './cx'
import s from './Textarea.module.css'

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label?: string
  hint?: string
  error?: string | null
  /** Affiche « 120 / 500 » au-dessus du champ (necessite maxLength). */
  showCount?: boolean
  className?: string
  fieldClassName?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    hint,
    error,
    showCount = false,
    className,
    fieldClassName,
    id,
    required,
    rows = 4,
    maxLength,
    value,
    defaultValue,
    onChange,
    ...rest
  },
  ref,
) {
  const autoId = useId()
  const ids = fieldIds(id ?? autoId, {
    hint: Boolean(hint) && !error,
    error: Boolean(error),
    extra: rest['aria-describedby'],
  })

  // Champ non controle : on suit la longueur localement pour le compteur.
  const [localLength, setLocalLength] = useState(() => String(defaultValue ?? '').length)
  const length = value !== undefined ? String(value).length : localLength

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (value === undefined) setLocalLength(event.target.value.length)
    onChange?.(event)
  }

  const nearLimit = maxLength !== undefined && length > maxLength * 0.9

  return (
    <Field
      ids={ids}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={fieldClassName}
      meta={
        showCount && maxLength !== undefined ? (
          <span className={cx(nearLimit && s.countWarn)}>
            {length} / {maxLength}
          </span>
        ) : undefined
      }
    >
      <textarea
        {...rest}
        ref={ref}
        id={ids.inputId}
        className={cx(s.textarea, error && s.textareaError, className)}
        rows={rows}
        required={required}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
      />
    </Field>
  )
})
