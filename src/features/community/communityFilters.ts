import type { SelectOption } from '@/components/ui'
import { POST_TYPE_LABELS } from '@/lib/constants'
import type { PostSort } from '@/services/posts'
import type { Database } from '@/types/database'

/**
 * Etat des filtres de /communaute, serialise dans l'URL.
 *
 * L'URL est la source de verite, comme pour /actualites : un fil filtre reste
 * partageable par message, et le bouton « retour » du navigateur annule
 * reellement le dernier filtre pose.
 */

type PostType = Database['public']['Enums']['post_type']

const POST_TYPE_VALUES = Object.keys(POST_TYPE_LABELS) as PostType[]

/** Onglets du fil. Chacun correspond a une requete REELLEMENT differente. */
export type CommunityTab = 'recentes' | 'populaires' | 'decouvertes'

export const COMMUNITY_TABS: readonly CommunityTab[] = ['recentes', 'populaires', 'decouvertes']

export const TAB_LABELS: Record<CommunityTab, string> = {
  recentes: 'Récentes',
  populaires: 'Populaires',
  decouvertes: 'Découvertes',
}

/**
 * Ce que chaque onglet change, dit sans detour : « Populaires » classe par
 * nombre de reactions (colonne `posts.reaction_count`, tenue par un
 * declencheur), pas par une audience estimee.
 */
export const TAB_HINTS: Record<CommunityTab, string> = {
  recentes: 'Les publications les plus récentes en premier.',
  populaires: 'Classement par nombre de réactions recues.',
  decouvertes: 'Uniquement les publications de type Découverte.',
}

export interface CommunityFilters {
  tab: CommunityTab
  /** Type de publication. Chaine vide = tous les types. */
  type: PostType | ''
  /** Tag clique depuis une publication. Chaine vide = aucun. */
  tag: string
  /** Terme de recherche. Chaine vide = aucune recherche. */
  q: string
}

export const DEFAULT_COMMUNITY_FILTERS: CommunityFilters = {
  tab: 'recentes',
  type: '',
  tag: '',
  q: '',
}

/** Noms des parametres d'URL, en francais comme le reste des routes. */
const PARAM = {
  tab: 'onglet',
  type: 'type',
  tag: 'tag',
  q: 'q',
} as const

export function asCommunityTab(value: string | null): CommunityTab {
  return COMMUNITY_TABS.includes(value as CommunityTab)
    ? (value as CommunityTab)
    : DEFAULT_COMMUNITY_FILTERS.tab
}

export function asPostType(value: string | null): PostType | '' {
  return POST_TYPE_VALUES.includes(value as PostType) ? (value as PostType) : ''
}

/** Lecture tolerante : un parametre inconnu ou invalide retombe sur le defaut. */
export function readCommunityFilters(params: URLSearchParams): CommunityFilters {
  return {
    tab: asCommunityTab(params.get(PARAM.tab)),
    type: asPostType(params.get(PARAM.type)),
    tag: (params.get(PARAM.tag) ?? '').slice(0, 48),
    q: (params.get(PARAM.q) ?? '').slice(0, 80),
  }
}

/** Seuls les filtres actifs apparaissent dans l'URL : elle reste lisible. */
export function writeCommunityFilters(filters: CommunityFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.tab !== DEFAULT_COMMUNITY_FILTERS.tab) params.set(PARAM.tab, filters.tab)
  if (filters.type) params.set(PARAM.type, filters.type)
  if (filters.tag) params.set(PARAM.tag, filters.tag)
  if (filters.q) params.set(PARAM.q, filters.q)
  return params
}

/** `true` des qu'un filtre ecarte le fil de son etat par defaut. */
export function hasActiveCommunityFilters(filters: CommunityFilters): boolean {
  return Boolean(filters.type || filters.tag || filters.q)
}

/** Tri reellement envoye a la base pour l'onglet courant. */
export function sortForTab(tab: CommunityTab): PostSort {
  return tab === 'populaires' ? 'popular' : 'recent'
}

/**
 * L'onglet « Découvertes » impose `post_type = 'discovery'` : le filtre de
 * type est alors neutralise cote interface, avec son explication visible.
 */
export function typeForTab(tab: CommunityTab, type: PostType | ''): PostType | undefined {
  if (tab === 'decouvertes') return 'discovery'
  return type || undefined
}

export function isTypeLocked(tab: CommunityTab): boolean {
  return tab === 'decouvertes'
}

export const POST_TYPE_OPTIONS: SelectOption[] = POST_TYPE_VALUES.map((value) => ({
  value,
  label: POST_TYPE_LABELS[value],
}))

/** Types proposes dans le composeur, dans l'ordre d'utilite attendue. */
export const COMPOSER_TYPE_OPTIONS: SelectOption[] = POST_TYPE_OPTIONS
