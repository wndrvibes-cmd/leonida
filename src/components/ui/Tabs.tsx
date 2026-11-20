import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cx } from './cx'
import s from './Tabs.module.css'

export interface TabItem {
  value: string
  label: string
  icon?: ReactNode
  /** Compteur ou pastille affiches apres le libelle. */
  badge?: ReactNode
  disabled?: boolean
  /** Identifiant du panneau associe, pour relier aria-controls. */
  panelId?: string
}

export interface TabsProps {
  items: TabItem[]
  /** Mode controle : fournir `value` + `onChange`. */
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  size?: 'sm' | 'md'
  /** Les onglets se partagent toute la largeur disponible. */
  fullWidth?: boolean
  ariaLabel?: string
  className?: string
}

/** Onglets avec indicateur anime, navigables aux fleches du clavier. */
export function Tabs({
  items,
  value,
  defaultValue,
  onChange,
  size = 'md',
  fullWidth = false,
  ariaLabel,
  className,
}: TabsProps) {
  const layoutId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.value ?? '')
  const active = value ?? internal

  const select = (next: string) => {
    if (value === undefined) setInternal(next)
    onChange?.(next)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const enabled = items.filter((item) => !item.disabled)
    if (enabled.length === 0) return

    const currentIndex = enabled.findIndex((item) => item.value === active)
    let nextIndex: number | null = null

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % enabled.length
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + enabled.length) % enabled.length
    }
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = enabled.length - 1
    if (nextIndex === null) return

    event.preventDefault()
    const target = enabled[nextIndex]
    select(target.value)
    listRef.current
      ?.querySelector<HTMLButtonElement>(`[data-tab-value="${target.value}"]`)
      ?.focus()
  }

  return (
    <div className={cx(s.scroller, 'scroll-x', className)}>
      <div
        ref={listRef}
        className={cx(s.list, s[size], fullWidth && s.full)}
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={onKeyDown}
      >
        {items.map((item) => {
          const isActive = item.value === active
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              data-tab-value={item.value}
              className={cx(s.tab, isActive && s.active)}
              aria-selected={isActive}
              aria-controls={item.panelId}
              tabIndex={isActive ? 0 : -1}
              disabled={item.disabled}
              onClick={() => select(item.value)}
            >
              {isActive ? (
                <motion.span
                  className={s.indicator}
                  layoutId={`tabs-indicator-${layoutId}`}
                  transition={{ type: 'spring', stiffness: 520, damping: 42 }}
                />
              ) : null}
              {item.icon ? <span className={s.icon}>{item.icon}</span> : null}
              <span className={s.label}>{item.label}</span>
              {item.badge !== undefined && item.badge !== null ? (
                <span className={s.badge}>{item.badge}</span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
