import { useCallback, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from './Icon'
import { cx } from './cx'
import { useIsMobile } from './useMediaQuery'
import { useBodyScrollLock, useEscapeKey, useFocusTrap } from './useOverlay'
import s from './Modal.module.css'

export type ModalSize = 'sm' | 'md' | 'lg'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  /** Nom accessible quand le dialogue n'affiche pas de titre visible. */
  ariaLabel?: string
  /** Phrase d'explication sous le titre, reliee au dialogue par aria. */
  description?: string
  children?: ReactNode
  /** Barre d'actions collee en bas, au-dessus de la zone de securite iPhone. */
  footer?: ReactNode
  size?: ModalSize
  /** Masque la croix : a reserver aux dialogues bloquants volontairement. */
  hideCloseButton?: boolean
  /** Empeche la fermeture par clic sur le fond (formulaire en cours d'envoi). */
  disableBackdropClose?: boolean
  className?: string
}

/**
 * Dialogue centre sur desktop, feuille montante sous 768px.
 * Le focus est piege, Echap ferme, le corps de page ne defile plus.
 */
export function Modal({
  open,
  onClose,
  title,
  ariaLabel,
  description,
  children,
  footer,
  size = 'md',
  hideCloseButton = false,
  disableBackdropClose = false,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const baseId = useId()
  const isMobile = useIsMobile()

  const handleClose = useCallback(() => onClose(), [onClose])

  useBodyScrollLock(open)
  useEscapeKey(open, handleClose)
  useFocusTrap(open, panelRef)

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className={s.layer}>
          <motion.div
            className={s.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={disableBackdropClose ? undefined : handleClose}
          />
          <motion.div
            ref={panelRef}
            className={cx(s.panel, s[size], className)}
            role="dialog"
            aria-modal="true"
            aria-label={title ? undefined : ariaLabel}
            aria-labelledby={title ? `${baseId}-title` : undefined}
            aria-describedby={description ? `${baseId}-description` : undefined}
            tabIndex={-1}
            initial={isMobile ? { y: '100%' } : { opacity: 0, y: 14, scale: 0.98 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={isMobile ? { y: '100%' } : { opacity: 0, y: 10, scale: 0.98 }}
            transition={
              isMobile
                ? { type: 'spring', stiffness: 420, damping: 38 }
                : { duration: 0.24, ease: 'easeOut' }
            }
          >
            {isMobile ? <span className={s.grabber} aria-hidden="true" /> : null}

            {title || !hideCloseButton ? (
              <header className={s.header}>
                <div className={s.headText}>
                  {title ? (
                    <h2 className={s.title} id={`${baseId}-title`}>
                      {title}
                    </h2>
                  ) : null}
                  {description ? (
                    <p className={s.description} id={`${baseId}-description`}>
                      {description}
                    </p>
                  ) : null}
                </div>
                {hideCloseButton ? null : (
                  <button
                    type="button"
                    className={s.close}
                    onClick={handleClose}
                    aria-label="Fermer"
                  >
                    <Icon name="close" size={20} />
                  </button>
                )}
              </header>
            ) : null}

            <div className={s.body}>{children}</div>

            {footer ? <footer className={s.footer}>{footer}</footer> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
