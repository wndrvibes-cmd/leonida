import { Button } from './Button'
import { Icon } from './Icon'
import { Modal } from './Modal'
import s from './ConfirmDialog.module.css'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  /** Consequence reelle de l'action, formulee sans ambiguite. */
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'accent'
  /** Action en cours : les deux boutons sont neutralises. */
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Confirmation d'une action destructive ou irreversible. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={loading ? () => undefined : onCancel}
      size="sm"
      ariaLabel={title}
      disableBackdropClose={loading}
      hideCloseButton
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className={s.content}>
        <span className={tone === 'danger' ? s.iconDanger : s.iconAccent} aria-hidden="true">
          <Icon name={tone === 'danger' ? 'alert' : 'info'} size={22} />
        </span>
        <div>
          <h2 className={s.title}>{title}</h2>
          <p className={s.message}>{message}</p>
        </div>
      </div>
    </Modal>
  )
}
