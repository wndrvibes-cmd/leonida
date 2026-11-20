import { useState } from 'react'
import { Icon } from './Icon'
import { cx } from './cx'
import s from './Avatar.module.css'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const ICON_SIZE: Record<AvatarSize, number> = { xs: 14, sm: 16, md: 20, lg: 28, xl: 40 }

export interface AvatarProps {
  /** `profiles.avatar_url`. Absent ou en erreur : repli sur les initiales. */
  src?: string | null
  /** `display_name` ou `username` : sert aux initiales et a l'alternative. */
  name?: string | null
  size?: AvatarSize
  /** Anneau orange reserve aux membres premium actifs. */
  isPremium?: boolean
  className?: string
}

/** Deux lettres au maximum, accents retires pour rester lisibles. */
function initials(name: string | null | undefined): string {
  if (!name) return ''
  const words = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .split(/[\s_.-]+/)
    .filter(Boolean)
  if (words.length === 0) return ''
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

export function Avatar({ src, name, size = 'md', isPremium = false, className }: AvatarProps) {
  const [failed, setFailed] = useState(false)
  const letters = initials(name)
  const showImage = Boolean(src) && !failed

  return (
    <span className={cx(s.avatar, s[size], isPremium && s.premium, className)}>
      <span className={s.inner}>
        {showImage ? (
          <img
            className={s.image}
            src={src ?? undefined}
            alt={name ? `Avatar de ${name}` : 'Avatar'}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
          />
        ) : letters ? (
          <span className={s.initials} aria-hidden="true">
            {letters}
          </span>
        ) : (
          <Icon name="user" size={ICON_SIZE[size]} className={s.fallbackIcon} />
        )}
      </span>
    </span>
  )
}
