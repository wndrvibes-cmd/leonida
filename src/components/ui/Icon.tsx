import type { ReactNode } from 'react'
import { cx } from './cx'
import s from './Icon.module.css'

/**
 * Jeu d'icones maison : trace unique a 24x24, contour `currentColor`.
 * Aucune dependance externe, aucun chargement reseau.
 */
export type IconName =
  | 'home' | 'news' | 'community' | 'moments' | 'map' | 'gift' | 'sparkles'
  | 'user' | 'users' | 'settings' | 'bell' | 'search' | 'plus' | 'close' | 'check'
  | 'chevron-left' | 'chevron-right' | 'chevron-down' | 'chevron-up'
  | 'arrow-left' | 'arrow-right'
  | 'heart' | 'fire' | 'comment' | 'bookmark' | 'share' | 'flag' | 'flag-2'
  | 'shield' | 'trash' | 'edit' | 'image' | 'upload' | 'download' | 'external'
  | 'filter' | 'menu' | 'logout' | 'crown' | 'pin' | 'car' | 'target' | 'coins'
  | 'trophy' | 'gem' | 'compass' | 'eye' | 'clock' | 'alert' | 'info'
  | 'zoom-in' | 'zoom-out' | 'locate' | 'send' | 'loader' | 'refresh'
  | 'star' | 'lock' | 'mail' | 'camera' | 'play' | 'more' | 'calendar' | 'video'

const PATHS: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.3V20.5h13V9.3" />
      <path d="M9.8 20.5v-5.8h4.4v5.8" />
    </>
  ),
  news: (
    <>
      <rect x="3" y="5" width="14" height="14" rx="2.2" />
      <path d="M17 8h2.3A1.7 1.7 0 0 1 21 9.7v7.6a1.7 1.7 0 0 1-1.7 1.7H17" />
      <path d="M6.4 9h7.2M6.4 12h7.2M6.4 15h4.4" />
    </>
  ),
  community: (
    <>
      <circle cx="9.2" cy="8.2" r="3.2" />
      <path d="M3.6 20c0-3.1 2.5-5.2 5.6-5.2s5.6 2.1 5.6 5.2" />
      <path d="M16.3 5.4a3.2 3.2 0 0 1 0 5.6" />
      <path d="M17.6 14.8c1.8.8 2.8 2.4 2.8 4.4" />
    </>
  ),
  users: (
    <>
      <circle cx="9.2" cy="8.2" r="3.2" />
      <path d="M3.6 20c0-3.1 2.5-5.2 5.6-5.2s5.6 2.1 5.6 5.2" />
      <path d="M16.3 5.4a3.2 3.2 0 0 1 0 5.6" />
      <path d="M17.6 14.8c1.8.8 2.8 2.4 2.8 4.4" />
    </>
  ),
  moments: (
    <>
      <rect x="4" y="3.5" width="11.5" height="17" rx="2.6" />
      <path d="M18.2 6.6c1 .6 1.6 1.7 1.6 2.9v5c0 1.2-.6 2.3-1.6 2.9" />
    </>
  ),
  map: (
    <>
      <path d="M9 3.5 3.5 5.8v14.7L9 18.2l6 2.3 5.5-2.3V3.5L15 5.8z" />
      <path d="M9 3.5v14.7M15 5.8v14.7" />
    </>
  ),
  gift: (
    <>
      <rect x="3.5" y="9" width="17" height="11.5" rx="2.2" />
      <path d="M3.5 13.6h17M12 9v11.5" />
      <path d="M12 9S10.8 4 8.2 4a2.4 2.4 0 0 0 0 5zM12 9s1.2-5 3.8-5a2.4 2.4 0 0 1 0 5z" />
    </>
  ),
  sparkles: (
    <>
      <path d="M11 3.5 12.7 8l4.5 1.7L12.7 11.4 11 16l-1.7-4.6L4.8 9.7 9.3 8z" />
      <path d="M18 14.6l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.8 20.4c0-3.4 3.2-5.6 7.2-5.6s7.2 2.2 7.2 5.6" />
    </>
  ),
  settings: (
    <>
      <path d="M4.5 7h15M4.5 12h15M4.5 17h15" />
      <circle cx="9" cy="7" r="2" />
      <circle cx="15.2" cy="12" r="2" />
      <circle cx="8" cy="17" r="2" />
    </>
  ),
  bell: (
    <>
      <path d="M18 16.4V11a6 6 0 1 0-12 0v5.4L4.5 19h15z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.4 15.4 20.5 20.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="M4.8 12.6 9.6 17.4 19.2 6.8" />,
  'chevron-left': <path d="M14.5 5.5 8 12l6.5 6.5" />,
  'chevron-right': <path d="M9.5 5.5 16 12l-6.5 6.5" />,
  'chevron-down': <path d="M5.5 9.5 12 16l6.5-6.5" />,
  'chevron-up': <path d="M5.5 14.5 12 8l6.5 6.5" />,
  'arrow-left': (
    <>
      <path d="M19 12H5" />
      <path d="M10.5 6.5 5 12l5.5 5.5" />
    </>
  ),
  'arrow-right': (
    <>
      <path d="M5 12h14" />
      <path d="M13.5 6.5 19 12l-5.5 5.5" />
    </>
  ),
  heart: <path d="M12 20.3S3.8 15.3 3.8 9.7A4.6 4.6 0 0 1 12 6.9a4.6 4.6 0 0 1 8.2 2.8c0 5.6-8.2 10.6-8.2 10.6z" />,
  fire: (
    <>
      <path d="M12 21c3.6 0 6-2.3 6-5.4 0-4.3-4.3-5.5-3.4-9.6C11.7 7 9.8 9.3 9.8 11.4c0 1 .4 1.8 1 2.5-1.3-.2-2.2-1.2-2.6-2.4C7.4 12.7 6 13.9 6 15.6 6 18.7 8.4 21 12 21z" />
    </>
  ),
  comment: <path d="M20.5 12c0 4.1-3.8 7.4-8.5 7.4-1 0-2-.1-2.9-.4l-4.6 1.6 1.4-4A7 7 0 0 1 3.5 12c0-4.1 3.8-7.4 8.5-7.4s8.5 3.3 8.5 7.4z" />,
  bookmark: <path d="M6.5 4h11v16.5L12 16.8l-5.5 3.7z" />,
  share: (
    <>
      <path d="M12 15.5V4.5" />
      <path d="M8.3 8.2 12 4.5l3.7 3.7" />
      <path d="M6.5 12.5H5A1.5 1.5 0 0 0 3.5 14v5A1.5 1.5 0 0 0 5 20.5h14a1.5 1.5 0 0 0 1.5-1.5v-5a1.5 1.5 0 0 0-1.5-1.5h-1.5" />
    </>
  ),
  flag: (
    <>
      <path d="M6 20.5V4.2" />
      <path d="M6 4.8h10.8l-1.8 4 1.8 4H6z" />
    </>
  ),
  'flag-2': (
    <>
      <path d="M6 20.5V4" />
      <path d="M6 4.6l12 4-12 4z" />
    </>
  ),
  shield: <path d="M12 3.5 5 6v6c0 4 3 7.2 7 8.5 4-1.3 7-4.5 7-8.5V6z" />,
  trash: (
    <>
      <path d="M4.5 7.5h15" />
      <path d="M9.5 7.5V5.3A1.3 1.3 0 0 1 10.8 4h2.4a1.3 1.3 0 0 1 1.3 1.3v2.2" />
      <path d="M6.6 7.5 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2A1.5 1.5 0 0 0 16.6 19l.8-11.5" />
      <path d="M10.5 11v6M13.5 11v6" />
    </>
  ),
  edit: (
    <>
      <path d="M16.8 4.6a2.1 2.1 0 0 1 3 3L8.4 19H4.5v-3.9z" />
      <path d="M15 6.4l3 3" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="8.8" cy="10" r="1.8" />
      <path d="M3.8 17.6 9 13l4 3.4 3.2-2.6 4.1 3.8" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4.5" />
      <path d="M8 8.5 12 4.5l4 4" />
      <path d="M4.5 15v3.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V15" />
    </>
  ),
  download: (
    <>
      <path d="M12 4.5V16" />
      <path d="M8 12l4 4 4-4" />
      <path d="M4.5 15v3.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V15" />
    </>
  ),
  external: (
    <>
      <path d="M14 4.5h5.5V10" />
      <path d="M19.5 4.5 11 13" />
      <path d="M18 14.5v4A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6h4" />
    </>
  ),
  filter: <path d="M4.5 6.5h15M7.5 12h9M10.5 17.5h3" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  logout: (
    <>
      <path d="M10 20.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5h4" />
      <path d="M15 8l4 4-4 4" />
      <path d="M19 12H9" />
    </>
  ),
  crown: (
    <>
      <path d="M3.5 7.5 7 12l5-7 5 7 3.5-4.5-1.3 10H4.8z" />
      <path d="M4.8 20.5h14.4" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6.5-6.1 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 14.9 12 21 12 21z" />
      <circle cx="12" cy="10.3" r="2.4" />
    </>
  ),
  car: (
    <>
      <path d="M5.2 15.6 6.8 9.4A2.2 2.2 0 0 1 8.9 7.8h6.2a2.2 2.2 0 0 1 2.1 1.6l1.6 6.2" />
      <path d="M4.2 15.6h15.6v2.6H4.2z" />
      <circle cx="7.6" cy="18.2" r="1.6" />
      <circle cx="16.4" cy="18.2" r="1.6" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="12" cy="12" r="0.9" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="12" cy="7" rx="6.5" ry="2.9" />
      <path d="M5.5 7v4.2c0 1.6 2.9 2.9 6.5 2.9s6.5-1.3 6.5-2.9V7" />
      <path d="M5.5 11.2v4.2c0 1.6 2.9 2.9 6.5 2.9s6.5-1.3 6.5-2.9v-4.2" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4.5h8v4.8a4 4 0 0 1-8 0z" />
      <path d="M8 6H5.5v1.6a3.2 3.2 0 0 0 3.1 3.2M16 6h2.5v1.6a3.2 3.2 0 0 1-3.1 3.2" />
      <path d="M12 14v3M8.5 20h7" />
    </>
  ),
  gem: (
    <>
      <path d="M7.2 4h9.6L21 9.6 12 20.5 3 9.6z" />
      <path d="M3 9.6h18M9.2 4 7.2 9.6l4.8 10.9 4.8-10.9L14.8 4" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15.3 8.7 13.5 13.5 8.7 15.3 10.5 10.5z" />
    </>
  ),
  eye: (
    <>
      <path d="M2.8 12S6.3 6 12 6s9.2 6 9.2 6-3.5 6-9.2 6-9.2-6-9.2-6z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.2V12l3.4 2.2" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4.2 2.8 20h18.4z" />
      <path d="M12 10v4.2M12 17.2h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11.2v5M12 7.8h.01" />
    </>
  ),
  'zoom-in': (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.4 15.4 20.5 20.5M10.5 7.8v5.4M7.8 10.5h5.4" />
    </>
  ),
  'zoom-out': (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.4 15.4 20.5 20.5M7.8 10.5h5.4" />
    </>
  ),
  locate: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <circle cx="12" cy="12" r="7.4" />
      <path d="M12 2.6v2.6M12 18.8v2.6M2.6 12h2.6M18.8 12h2.6" />
    </>
  ),
  send: (
    <>
      <path d="M20.5 3.5 10.2 13.8" />
      <path d="M20.5 3.5 14.4 20.5l-4.2-6.7-6.7-4.2z" />
    </>
  ),
  loader: <path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4M6 6l2.8 2.8M15.2 15.2 18 18M18 6l-2.8 2.8M8.8 15.2 6 18" />,
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.5-5.8" />
      <path d="M20.3 4.6v4.2h-4.2" />
    </>
  ),
  star: <path d="M12 4l2.5 5.1 5.6.8-4.1 4 1 5.6-5-2.7-5 2.7 1-5.6-4.1-4 5.6-.8z" />,
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2.2" />
      <path d="M3.6 7.2 12 13l8.4-5.8" />
    </>
  ),
  camera: (
    <>
      <path d="M3.5 9.5a2 2 0 0 1 2-2h1.8l1.3-2h6.8l1.3 2h1.8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="13.4" r="3.4" />
    </>
  ),
  play: <path d="M8 5.5 19 12 8 18.5z" />,
  more: (
    <>
      <circle cx="5.6" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="18.4" cy="12" r="1.4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.2" />
      <path d="M3.5 10.2h17M8.5 3.5V7M15.5 3.5V7" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6" width="12.5" height="12" rx="2.2" />
      <path d="M15.5 10.4 21 7.4v9.2l-5.5-3z" />
    </>
  ),
}

export interface IconProps {
  name: IconName
  /** Cote en pixels. 20 par defaut ; 24 pour les barres de navigation. */
  size?: number
  strokeWidth?: number
  /** Remplit le trace (coeur aime, favori pose...). */
  filled?: boolean
  className?: string
  /** Fournir un titre rend l'icone accessible ; sinon elle est decorative. */
  title?: string
}

export function Icon({
  name,
  size = 20,
  strokeWidth = 1.75,
  filled = false,
  className,
  title,
}: IconProps) {
  return (
    <svg
      className={cx(s.icon, name === 'loader' && s.spin, className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name]}
    </svg>
  )
}
