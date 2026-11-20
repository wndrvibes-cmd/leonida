import type { IconName } from '@/components/ui'

/**
 * `map_categories.icon` est une colonne texte libre, remplie par
 * l'administration. Elle n'est donc PAS typee `IconName` : une valeur inconnue
 * (categorie creee avec un nom d'icone absent du jeu) doit retomber sur une
 * epingle neutre plutot que de rendre une icone vide.
 *
 * La liste ci-dessous est typee `IconName[]` : si le jeu d'icones evolue,
 * TypeScript signale immediatement une entree devenue invalide.
 */
const KNOWN_ICONS: readonly IconName[] = [
  'home', 'news', 'community', 'moments', 'map', 'gift', 'sparkles',
  'user', 'users', 'settings', 'bell', 'search', 'plus', 'close', 'check',
  'chevron-left', 'chevron-right', 'chevron-down', 'chevron-up',
  'arrow-left', 'arrow-right',
  'heart', 'fire', 'comment', 'bookmark', 'share', 'flag', 'flag-2',
  'shield', 'trash', 'edit', 'image', 'upload', 'download', 'external',
  'filter', 'menu', 'logout', 'crown', 'pin', 'car', 'target', 'coins',
  'trophy', 'gem', 'compass', 'eye', 'clock', 'alert', 'info',
  'zoom-in', 'zoom-out', 'locate', 'send', 'loader', 'refresh',
  'star', 'lock', 'mail', 'camera', 'play', 'more', 'calendar', 'video',
]

const ICON_SET = new Set<string>(KNOWN_ICONS)

/** Epingle par defaut : jamais d'icone vide sur la carte. */
export const FALLBACK_CATEGORY_ICON: IconName = 'pin'

export function categoryIcon(icon: string | null | undefined): IconName {
  if (!icon) return FALLBACK_CATEGORY_ICON
  const trimmed = icon.trim()
  return ICON_SET.has(trimmed) ? (trimmed as IconName) : FALLBACK_CATEGORY_ICON
}

/**
 * `map_categories.accent` est egalement du texte libre. On ne l'injecte dans
 * une variable CSS que si elle ressemble a une couleur exploitable, afin
 * qu'une valeur erronee ne casse pas le rendu : la couleur de reprise est
 * alors le turquoise de l'application.
 */
const SAFE_COLOR = /^(#[0-9a-f]{3,8}|[a-z-]{3,24})$/i

export function categoryAccent(accent: string | null | undefined): string {
  if (!accent) return 'var(--accent)'
  const trimmed = accent.trim()
  if (trimmed.startsWith('var(--') && trimmed.endsWith(')')) return trimmed
  return SAFE_COLOR.test(trimmed) ? trimmed : 'var(--accent)'
}
