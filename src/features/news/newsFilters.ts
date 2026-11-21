import type { SelectOption } from '@/components/ui'
import { RELIABILITY_LABELS } from '@/lib/constants'
import type { Database } from '@/types/database'
import type { NewsSort } from './newsQueries'

/**
 * Etat des filtres de /actualites, serialise dans l'URL.
 *
 * L'URL est la source de verite : un filtre partage par message reste
 * reproductible, et le bouton « retour » du navigateur annule reellement le
 * dernier filtre pose.
 */

type Reliability = Database['public']['Enums']['reliability']

const RELIABILITY_VALUES = Object.keys(RELIABILITY_LABELS) as Reliability[]

export interface NewsFilters {
  /** Terme de recherche. Chaine vide = aucune recherche. */
  q: string
  /** Slug de categorie. Chaine vide = toutes les categories. */
  category: string
  /** Chaine vide = tous les niveaux de fiabilite. */
  reliability: Reliability | ''
  sort: NewsSort
  /** Tag clique depuis un article. Chaine vide = aucun. */
  tag: string
}

export const DEFAULT_NEWS_FILTERS: NewsFilters = {
  q: '',
  category: '',
  reliability: '',
  sort: 'recent',
  tag: '',
}

/** Noms des parametres d'URL, en francais comme le reste des routes. */
const PARAM = {
  q: 'q',
  category: 'catégorie',
  reliability: 'fiabilité',
  sort: 'tri',
  tag: 'tag',
} as const

/** Conversion sure d'une valeur venue de l'URL ou d'un `<select>`. */
export function asReliability(value: string | null): Reliability | '' {
  return RELIABILITY_VALUES.includes(value as Reliability) ? (value as Reliability) : ''
}

export function asSort(value: string | null): NewsSort {
  return value === 'oldest' ? 'oldest' : 'recent'
}

/** Lecture tolerante : un parametre inconnu ou invalide retombe sur le defaut. */
export function readNewsFilters(params: URLSearchParams): NewsFilters {
  return {
    q: (params.get(PARAM.q) ?? '').slice(0, 80),
    category: (params.get(PARAM.category) ?? '').slice(0, 72),
    reliability: asReliability(params.get(PARAM.reliability)),
    sort: asSort(params.get(PARAM.sort)),
    tag: (params.get(PARAM.tag) ?? '').slice(0, 48),
  }
}

/** Seuls les filtres actifs apparaissent dans l'URL : elle reste lisible. */
export function writeNewsFilters(filters: NewsFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.q) params.set(PARAM.q, filters.q)
  if (filters.category) params.set(PARAM.category, filters.category)
  if (filters.reliability) params.set(PARAM.reliability, filters.reliability)
  if (filters.sort !== DEFAULT_NEWS_FILTERS.sort) params.set(PARAM.sort, filters.sort)
  if (filters.tag) params.set(PARAM.tag, filters.tag)
  return params
}

/** `true` des qu'un filtre ecarte l'ecran de son etat par defaut. */
export function hasActiveNewsFilters(filters: NewsFilters): boolean {
  return Boolean(filters.q || filters.category || filters.reliability || filters.tag)
}

export const RELIABILITY_OPTIONS: SelectOption[] = RELIABILITY_VALUES.map((value) => ({
  value,
  label: RELIABILITY_LABELS[value].label,
}))

/**
 * Tris proposes.
 *
 * Volontairement PAS de « les plus vues » : `news_articles.view_count` n'est
 * incrementable que par le staff (policy `news_update_staff`), le compteur ne
 * reflete donc pas l'audience reelle. Classer dessus afficherait un palmares
 * faux.
 */
export const SORT_OPTIONS: SelectOption[] = [
  { value: 'recent', label: 'Plus récentes' },
  { value: 'oldest', label: 'Plus anciennes' },
]
