import type { PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js'

/**
 * Briques communes a tous les services : pagination par curseur, remontee
 * d'erreur et assainissement des termes de recherche.
 *
 * Aucun appel reseau ici : uniquement de la logique pure, testable.
 */

/* ========================================================== PAGINATION === */

export interface Page<T> {
  items: T[]
  /** `null` quand il n'y a plus rien a charger. Opaque : ne pas interpreter. */
  nextCursor: string | null
}

export const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

/** Borne la taille de page : protege la base d'une valeur venue de l'URL. */
export function safeLimit(limit?: number | null): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) return DEFAULT_LIMIT
  return Math.min(Math.max(Math.trunc(limit), 1), MAX_LIMIT)
}

/**
 * Les listes demandent toujours `limit + 1` lignes : la ligne excedentaire
 * sert uniquement a savoir s'il reste une page, sans requete COUNT.
 */
export function sliceToPage<T>(
  rows: T[],
  limit: number,
  cursorOf: (row: T) => string,
): Page<T> {
  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows
  const last = items.length > 0 ? items[items.length - 1] : undefined
  return { items, nextCursor: hasMore && last ? cursorOf(last) : null }
}

/**
 * Curseur composite pour un tri par popularite : le rang seul ne suffit pas
 * (beaucoup d'ex aequo a 0 reaction), la date tranche les egalites.
 */
const RANK_SEPARATOR = '~'

export function encodeRankCursor(rank: number, isoDate: string): string {
  return `${rank}${RANK_SEPARATOR}${isoDate}`
}

export function decodeRankCursor(
  cursor: string | null | undefined,
): { rank: number; date: string } | null {
  if (!cursor) return null
  const at = cursor.indexOf(RANK_SEPARATOR)
  if (at <= 0) return null
  const rank = Number(cursor.slice(0, at))
  const date = cursor.slice(at + 1)
  if (!Number.isInteger(rank) || rank < 0 || !date) return null
  return { rank, date }
}

/* =============================================================== ERREURS === */

/**
 * Erreur normalisee des services. Le message d'origine est conserve tel quel :
 * c'est `readableError()` qui le traduit au moment de l'affichage, et le code
 * PostgreSQL reste disponible pour distinguer les cas (RLS, doublon...).
 */
export class ServiceError extends Error {
  readonly code: string | undefined
  readonly details: string | undefined

  constructor(source: PostgrestError | Error | string) {
    const message = typeof source === 'string' ? source : source.message
    super(message || 'Une erreur est survenue.')
    this.name = 'ServiceError'
    const candidate = typeof source === 'string' ? null : (source as PostgrestError)
    this.code = candidate?.code ?? undefined
    this.details = candidate?.details ?? undefined
  }
}

/**
 * On reprend TEL QUEL le type de reponse de postgrest-js au lieu d'en
 * redeclarer un equivalent.
 *
 * Ce detail n'est pas cosmetique. Une signature maison du genre
 * `{ data: T | null; error: PostgrestError | null }` oblige TypeScript a
 * inferer `T` en confrontant les deux branches de l'union renvoyee par
 * Supabase ; l'inference echoue et retombe sur `never`. Toutes les lectures
 * de proprietes en aval cassaient alors avec
 * « Property 'x' does not exist on type 'never' ».
 *
 * A noter : toutes les requetes aboutissent a `PostgrestSingleResponse<X>`,
 * y compris les listes — pour `select()` sans `single()`, `X` vaut `Row[]`.
 */

/** Donnee obligatoire : absente, c'est une erreur. */
export function unwrap<T>(result: PostgrestSingleResponse<T>): NonNullable<T> {
  if (result.error) throw new ServiceError(result.error)
  if (result.data === null || result.data === undefined) {
    throw new ServiceError('Donnée introuvable.')
  }
  return result.data as NonNullable<T>
}

/** Donnee facultative : `maybeSingle()` peut legitimement ne rien renvoyer. */
export function unwrapMaybe<T>(result: PostgrestSingleResponse<T>): T | null {
  if (result.error) throw new ServiceError(result.error)
  return result.data
}

export function unwrapCount(result: { count: number | null; error: PostgrestError | null }): number {
  if (result.error) throw new ServiceError(result.error)
  return result.count ?? 0
}

export function unwrapVoid(result: { error: PostgrestError | null }): void {
  if (result.error) throw new ServiceError(result.error)
}

/** `true` si la base a refuse l'operation au titre de la RLS. */
export function isPermissionDenied(error: unknown): boolean {
  const candidate = error as { code?: string; message?: string } | null | undefined
  if (candidate?.code === '42501') return true
  return /row-level security|permission denied/i.test(candidate?.message ?? '')
}

/* ============================================================ RECHERCHE === */

/**
 * Prepare un terme saisi par un membre :
 *   - `%` et `_` sont des jokers SQL, on les retire pour que la recherche
 *     reste litterale ;
 *   - la longueur est bornee pour ne pas construire de requete absurde.
 */
export function sanitizeSearch(input: string | null | undefined): string {
  if (!input) return ''
  return input.replace(/[%_\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
}

/**
 * Valeur d'un `ilike` a l'interieur d'un `or()` PostgREST.
 *
 * Deux contraintes de syntaxe, pas de confort :
 *   - la virgule et les parentheses separent les termes d'un `or()`, elles
 *     sont donc remplacees par une espace ;
 *   - dans cette forme, le joker s'ecrit `*` et non `%`.
 * On obtient `title.ilike.*terme*`, la forme canonique de PostgREST.
 */
export function ilikeValue(term: string): string {
  return `*${term.replace(/[,()"']/g, ' ').replace(/\s+/g, ' ').trim()}*`
}

/** Deux caracteres minimum : en dessous, toute la base remonterait. */
export const MIN_SEARCH_LENGTH = 2
