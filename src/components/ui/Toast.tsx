import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import { cx } from './cx'
import s from './Toast.module.css'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastInput {
  title: string
  description?: string
  variant?: ToastVariant
  /** Duree d'affichage en millisecondes ; 0 garde la notification ouverte. */
  duration?: number
  /** Action unique (« Annuler », « Voir »). */
  action?: { label: string; onClick: () => void }
}

export interface ToastItem extends ToastInput {
  id: string
  variant: ToastVariant
  duration: number
}

const ICONS: Record<ToastVariant, IconName> = {
  success: 'check',
  error: 'alert',
  info: 'info',
}

export interface ToastProps {
  item: ToastItem
  onDismiss: (id: string) => void
}

export function Toast({ item, onDismiss }: ToastProps) {
  return (
    <div
      className={cx(s.toast, s[item.variant])}
      role={item.variant === 'error' ? 'alert' : 'status'}
      aria-live={item.variant === 'error' ? 'assertive' : 'polite'}
    >
      <span className={s.icon} aria-hidden="true">
        <Icon name={ICONS[item.variant]} size={18} />
      </span>

      <div className={s.body}>
        <p className={s.title}>{item.title}</p>
        {item.description ? <p className={s.description}>{item.description}</p> : null}
        {item.action ? (
          <button
            type="button"
            className={s.action}
            onClick={() => {
              item.action?.onClick()
              onDismiss(item.id)
            }}
          >
            {item.action.label}
          </button>
        ) : null}
      </div>

      <button
        type="button"
        className={s.close}
        onClick={() => onDismiss(item.id)}
        aria-label="Fermer la notification"
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  )
}

/** Rendu brut utilise par la file d'attente ; expose pour les tests visuels. */
export type ToastRenderer = (item: ToastItem) => ReactNode
