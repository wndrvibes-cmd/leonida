import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toast, type ToastInput, type ToastItem, type ToastVariant } from './Toast'
import { useIsMobile } from './useMediaQuery'
import s from './ToastProvider.module.css'

interface ToastApi {
  /** File d'attente generique. Renvoie l'identifiant pour fermer a la main. */
  toast: (input: ToastInput) => string
  success: (title: string, description?: string) => string
  error: (title: string, description?: string) => string
  info: (title: string, description?: string) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const api = useContext(ToastContext)
  if (!api) throw new Error('useToast() doit être appele a l\'intérieur de <ToastProvider>.')
  return api
}

/** Au-dela, les plus anciennes notifications cedent la place. */
const MAX_VISIBLE = 3

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 4000,
  info: 4500,
  // Une erreur reste plus longtemps : elle demande souvent une lecture.
  error: 7000,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const timers = useRef(new Map<string, number>())
  const isMobile = useIsMobile()

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id)
    if (timer !== undefined) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
    setItems((previous) => previous.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback(
    (input: ToastInput) => {
      const variant = input.variant ?? 'info'
      const id = crypto.randomUUID()
      const item: ToastItem = {
        ...input,
        id,
        variant,
        duration: input.duration ?? DEFAULT_DURATION[variant],
      }

      setItems((previous) => [...previous, item].slice(-MAX_VISIBLE))

      if (item.duration > 0) {
        timers.current.set(
          id,
          window.setTimeout(() => dismiss(id), item.duration),
        )
      }
      return id
    },
    [dismiss],
  )

  const success = useCallback(
    (title: string, description?: string) => toast({ title, description, variant: 'success' }),
    [toast],
  )
  const error = useCallback(
    (title: string, description?: string) => toast({ title, description, variant: 'error' }),
    [toast],
  )
  const info = useCallback(
    (title: string, description?: string) => toast({ title, description, variant: 'info' }),
    [toast],
  )

  // Les minuteries en cours doivent mourir avec le fournisseur.
  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach((timer) => window.clearTimeout(timer))
      pending.clear()
    }
  }, [])

  const api = useMemo<ToastApi>(
    () => ({ toast, success, error, info, dismiss }),
    [toast, success, error, info, dismiss],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document === 'undefined'
        ? null
        : createPortal(
            <div className={s.stack}>
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    className={s.slot}
                    layout
                    initial={{ opacity: 0, y: isMobile ? 16 : -16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: isMobile ? 16 : -12, scale: 0.97 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                  >
                    <Toast item={item} onDismiss={dismiss} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>,
            document.body,
          )}
    </ToastContext.Provider>
  )
}
