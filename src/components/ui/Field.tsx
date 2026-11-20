import type { ReactNode } from 'react'
import { cx } from './cx'
import s from './Field.module.css'

export interface FieldIds {
  inputId: string
  hintId: string
  errorId: string
  describedBy: string | undefined
}

/** Relie label, aide et erreur a un champ pour les lecteurs d'ecran. */
export function fieldIds(
  baseId: string,
  options: { hint?: boolean; error?: boolean; extra?: string },
): FieldIds {
  const hintId = `${baseId}-hint`
  const errorId = `${baseId}-error`
  const parts = [
    options.hint ? hintId : null,
    options.error ? errorId : null,
    options.extra ?? null,
  ].filter(Boolean)
  return {
    inputId: baseId,
    hintId,
    errorId,
    describedBy: parts.length > 0 ? parts.join(' ') : undefined,
  }
}

export interface FieldProps {
  ids: FieldIds
  label?: string
  hint?: string
  error?: string | null
  required?: boolean
  /** Texte additionnel aligne a droite du label (compteur de caracteres). */
  meta?: ReactNode
  className?: string
  children: ReactNode
}

export function Field({ ids, label, hint, error, required, meta, className, children }: FieldProps) {
  return (
    <div className={cx(s.field, className)}>
      {label || meta ? (
        <div className={s.labelRow}>
          {label ? (
            <label className={s.label} htmlFor={ids.inputId}>
              {label}
              {required ? (
                <span className={s.required} aria-hidden="true">
                  *
                </span>
              ) : null}
            </label>
          ) : (
            <span />
          )}
          {meta ? <span className={s.meta}>{meta}</span> : null}
        </div>
      ) : null}

      {children}

      {hint && !error ? (
        <p className={s.hint} id={ids.hintId}>
          {hint}
        </p>
      ) : null}

      {error ? (
        <p className={s.error} id={ids.errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
