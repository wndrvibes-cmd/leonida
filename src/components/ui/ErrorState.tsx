import { readableError } from '@/lib/supabase'
import { Button } from './Button'
import { Icon } from './Icon'
import { cx } from './cx'
import s from './ErrorState.module.css'

export interface ErrorStateProps {
  /** Erreur brute (Supabase, reseau, exception) traduite par readableError. */
  error?: unknown
  title?: string
  /** Remplace le message deduit de l'erreur. */
  description?: string
  onRetry?: () => void
  retryLabel?: string
  compact?: boolean
  className?: string
}

export function ErrorState({
  error,
  title = 'Chargement impossible',
  description,
  onRetry,
  retryLabel = 'Reessayer',
  compact = false,
  className,
}: ErrorStateProps) {
  const message = description ?? (error ? readableError(error) : 'Une erreur est survenue.')

  return (
    <div className={cx(s.wrap, compact && s.compact, className)} role="alert">
      <span className={s.badge} aria-hidden="true">
        <Icon name="alert" size={compact ? 18 : 22} />
      </span>
      <div className={s.body}>
        <p className={s.title}>{title}</p>
        <p className={s.message}>{message}</p>
      </div>
      {onRetry ? (
        <div className={s.action}>
          <Button
            variant="secondary"
            size={compact ? 'sm' : 'md'}
            iconLeft={<Icon name="refresh" size={16} />}
            onClick={onRetry}
          >
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
