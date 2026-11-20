import { useCallback, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from './Icon'
import { cx } from './cx'
import { useIsMobile } from './useMediaQuery'
import { useBodyScrollLock, useEscapeKey, useFocusTrap } from './useOverlay'
import s from './Sheet.module.css'

export interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  ariaLabel?: string
  /** Cote d'apparition sur desktop ; sur mobile le panneau monte du bas. */
  side?: 'right' | 'left'
  children?: ReactNode
  /** Actions persistantes : « Appliquer les filtres », « Tout effacer ». */
  footer?: ReactNode
  className?: string
}

/**
 * Panneau lateral (filtres, options de carte). Sous 768px il devient une
 * feuille montante occupant au plus 88% de la hauteur visible.
 */
export function Sheet({
  open,
  onClose,
  title,
  ariaLabel,
  side = 'right',
  children,
  footer,
  className,
}: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const baseId = useId()
  const isMobile = useIsMobile()

  const handleClose = useCallback(() => onClose(), [onClose])

  useBodyScrollLock(open)
  useEscapeKey(open, handleClose)
  useFocusTrap(open, panelRef)

  if (typeof document === 'undefined') return null

  const offscreen = isMobile ? { y: '100%' } : { x: side === 'right' ? '100%' : '-100%' }
  const onscreen = isMobile ? { y: 0 } : { x: 0 }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className={cx(s.layer, s[side])}>
          <motion.div
            className={s.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={handleClose}
          />
          <motion.div
            ref={panelRef}
            className={cx(s.panel, className)}
            role="dialog"
            aria-modal="true"
            aria-label={title ? undefined : ariaLabel}
            aria-labelledby={title ? `${baseId}-title` : undefined}
            tabIndex={-1}
            initial={offscreen}
            animate={onscreen}
            exit={offscreen}
            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
          >
            {isMobile ? <span className={s.grabber} aria-hidden="true" /> : null}

            <header className={s.header}>
              {title ? (
                <h2 className={s.title} id={`${baseId}-title`}>
                  {title}
                </h2>
              ) : (
                <span />
              )}
              <button type="button" className={s.close} onClick={handleClose} aria-label="Fermer">
                <Icon name="close" size={20} />
              </button>
            </header>

            <div className={s.body}>{children}</div>

            {footer ? <footer className={s.footer}>{footer}</footer> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
