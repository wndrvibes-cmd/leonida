import type { IconName } from '@/components/ui'
import type { HomeSection } from '@/services/settings'

/**
 * Reglages locaux de la page d'accueil.
 *
 * Rien ici n'est une donnee de contenu : uniquement des bornes de requete, des
 * libelles de repli et la correspondance entre une categorie de carte et une
 * icone du jeu de primitives.
 */

/** Cles de section reconnues par l'accueil (reglage `home.sections`). */
export const HOME_SECTION_KEYS = [
  'news', 'discoveries', 'community', 'moments', 'map', 'contests', 'ai', 'premium',
] as const

export type HomeSectionKey = (typeof HOME_SECTION_KEYS)[number]

export function isHomeSectionKey(key: string): key is HomeSectionKey {
  return (HOME_SECTION_KEYS as readonly string[]).includes(key)
}

/**
 * Repli utilise UNIQUEMENT si `home.sections` est absent ou illisible.
 * Reproduit l'ordre installe par la migration 0007 : ce n'est pas une
 * invention, c'est la configuration livree avec la base.
 */
export const DEFAULT_HOME_SECTIONS: HomeSection[] = [
  { key: 'news',        label: 'Actualites recentes',   enabled: true, order: 10 },
  { key: 'discoveries', label: 'Dernieres decouvertes', enabled: true, order: 20 },
  { key: 'community',   label: 'La communaute',         enabled: true, order: 30 },
  { key: 'moments',     label: 'Moments populaires',    enabled: true, order: 40 },
  { key: 'map',         label: 'Explorer la carte',     enabled: true, order: 50 },
  { key: 'contests',    label: 'Concours et cadeaux',   enabled: true, order: 60 },
  { key: 'ai',          label: 'LEONIDA AI',            enabled: true, order: 70 },
  { key: 'premium',     label: 'LEONIDA+',              enabled: true, order: 80 },
]

/* ------------------------------------------------------------- REQUETES -- */

/** Volumes volontairement courts : l'accueil est une vitrine, pas un fil. */
export const HOME_LIMITS = {
  news: 6,
  discoveries: 8,
  community: 6,
  moments: 8,
  contests: 6,
} as const

/**
 * Filtres figes au niveau du module : la cle de cache reste stable d'un rendu
 * a l'autre et l'accueil ne bouscule pas le cache des pages de rubrique.
 */
export const HOME_QUERY_SCOPE = 'home' as const

/** Une minute : l'accueil se rafraichit vite sans marteler la base. */
export const HOME_STALE_TIME = 60_000
/** Taxonomies : elles ne bougent quasiment jamais. */
export const TAXONOMY_STALE_TIME = 10 * 60_000

/* -------------------------------------------------- ICONES DE CATEGORIE -- */

/**
 * `map_categories.icon` est un texte libre en base : il ne correspond pas
 * forcement a une icone existante. On ne convertit donc que les valeurs
 * connues (celles installees par la migration 0007), les autres retombent sur
 * le repere generique plutot que de faire planter le rendu.
 */
const MARKER_ICONS: Record<string, IconName> = {
  sparkle: 'sparkles',
  sparkles: 'sparkles',
  car: 'car',
  target: 'target',
  coins: 'coins',
  trophy: 'trophy',
  gem: 'gem',
  compass: 'compass',
  flag: 'flag',
  pin: 'pin',
  star: 'star',
  map: 'map',
}

export function markerIcon(icon: string | null | undefined): IconName {
  if (!icon) return 'pin'
  return MARKER_ICONS[icon] ?? 'pin'
}
