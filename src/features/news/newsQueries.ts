import { supabase } from '@/lib/supabase'
import type { NewsListItem } from '@/services/news'
import {
  ilikeValue,
  MIN_SEARCH_LENGTH,
  safeLimit,
  sanitizeSearch,
  unwrap,
  type Page,
} from '@/services/query'
import type { Database } from '@/types/database'

/**
 * Acces liste de la rubrique actualites.
 *
 * POURQUOI CE FICHIER EXISTE plutot qu'un simple appel a `listNews()` :
 * `src/services/news.ts` ne sait filtrer que par categorie, tag et recherche,
 * et trie toujours du plus recent au plus ancien. L'ecran /actualites demande
 * en plus un filtre de FIABILITE et un choix de TRI. Le socle etant gele, la
 * requete vit ici, dans la zone du module.
 *
 * Elle reprend volontairement, trait pour trait, la pagination en deux phases
 * de `listNews()` (voir le commentaire « CURSEUR » de ce service) : en base,
 * `news_articles.published_at` est NULLABLE. Un curseur unique
 * `published_at < x` ferait disparaitre pour toujours les articles sans date.
 * On pagine donc la phase datee, puis la phase sans date, et le curseur porte
 * la phase en cours.
 *
 * Les briques communes (`unwrap`, `safeLimit`, `sanitizeSearch`, `ilikeValue`)
 * viennent du socle : rien n'est reecrit ici.
 */

type Reliability = Database['public']['Enums']['reliability']

export type NewsSort = 'recent' | 'oldest'

export interface NewsQueryOptions {
  /** Terme de recherche brut, saisi par le membre. Assaini ici. */
  q?: string
  /** Identifiant (pas le slug) de la categorie. */
  categoryId?: string
  tag?: string
  reliability?: Reliability
  sort?: NewsSort
  cursor?: string | null
  limit?: number
}

/* Doit rester une SEULE chaine litterale : supabase-js deduit le type des
   lignes en analysant ce texte. Une concatenation le degraderait en `string`
   et la requete perdrait tout typage. Memes colonnes que NEWS_LIST_COLUMNS
   du service (`body` exclu : inutile et lourd dans un fil). */
const LIST_COLUMNS = 'id,slug,title,excerpt,cover_url,category_id,author_id,source_name,source_url,reliability,status,published_at,tags,view_count,allow_comments,created_at' as const

function baseQuery(options: NewsQueryOptions) {
  let query = supabase
    .from('news_articles')
    .select(LIST_COLUMNS)
    // La RLS laisse le staff lire les brouillons : ils n'ont rien a faire
    // dans le fil public, d'ou ce filtre explicite cote requete.
    .eq('status', 'published')

  if (options.categoryId) query = query.eq('category_id', options.categoryId)
  if (options.tag) query = query.contains('tags', [options.tag])
  if (options.reliability) query = query.eq('reliability', options.reliability)

  const term = sanitizeSearch(options.q)
  if (term.length >= MIN_SEARCH_LENGTH) {
    const value = ilikeValue(term)
    query = query.or(`title.ilike.${value},excerpt.ilike.${value}`)
  }

  return query
}

/** Type du constructeur de requete, pour pouvoir le reaffecter plus bas. */
type NewsQuery = ReturnType<typeof baseQuery>

type CursorPhase = 'dated' | 'undated'
interface NewsCursor {
  phase: CursorPhase
  date: string
}

function encodeCursor(cursor: NewsCursor): string {
  return `${cursor.phase === 'dated' ? 'd' : 'u'}:${cursor.date}`
}

function decodeCursor(raw: string | null | undefined): NewsCursor | null {
  if (!raw || raw.length < 3) return null
  const prefix = raw.slice(0, 2)
  const date = raw.slice(2)
  if (!date) return null
  if (prefix === 'd:') return { phase: 'dated', date }
  if (prefix === 'u:') return { phase: 'undated', date }
  return null
}

async function fetchDated(
  options: NewsQueryOptions,
  count: number,
  after: string | null,
  ascending: boolean,
): Promise<NewsListItem[]> {
  if (count <= 0) return []
  let query: NewsQuery = baseQuery(options).not('published_at', 'is', null)
  if (after) {
    query = ascending ? query.gt('published_at', after) : query.lt('published_at', after)
  }
  return unwrap(await query.order('published_at', { ascending }).limit(count))
}

/**
 * Articles sans date de publication. Ils arrivent TOUJOURS apres les articles
 * dates, quel que soit le tri : « plus ancien » ne peut pas classer une date
 * absente, et les inventer une place au milieu du fil serait arbitraire.
 */
async function fetchUndated(
  options: NewsQueryOptions,
  count: number,
  after: string | null,
  ascending: boolean,
): Promise<NewsListItem[]> {
  if (count <= 0) return []
  let query: NewsQuery = baseQuery(options).is('published_at', null)
  if (after) {
    query = ascending ? query.gt('created_at', after) : query.lt('created_at', after)
  }
  return unwrap(await query.order('created_at', { ascending }).limit(count))
}

export async function fetchNewsPage(options: NewsQueryOptions = {}): Promise<Page<NewsListItem>> {
  const ascending = options.sort === 'oldest'
  const limit = safeLimit(options.limit)
  const want = limit + 1
  const cursor = decodeCursor(options.cursor)

  let rows: NewsListItem[]
  if (cursor?.phase === 'undated') {
    rows = await fetchUndated(options, want, cursor.date, ascending)
  } else {
    rows = await fetchDated(options, want, cursor?.date ?? null, ascending)
    // Page frontiere : on complete avec les premiers articles sans date.
    if (rows.length < want) {
      rows = rows.concat(await fetchUndated(options, want - rows.length, null, ascending))
    }
  }

  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows
  const last = items.length > 0 ? items[items.length - 1] : undefined

  const nextCursor =
    hasMore && last
      ? encodeCursor(
          last.published_at
            ? { phase: 'dated', date: last.published_at }
            : { phase: 'undated', date: last.created_at },
        )
      : null

  return { items, nextCursor }
}

/**
 * Articles de la meme categorie, l'article courant exclu.
 *
 * On demande une ligne de plus que necessaire : l'article courant fait partie
 * de sa propre categorie et sera retire de la liste.
 */
export async function fetchRelatedNews(
  categoryId: string,
  excludeId: string,
  limit = 3,
): Promise<NewsListItem[]> {
  const page = await fetchNewsPage({ categoryId, sort: 'recent', limit: limit + 1 })
  return page.items.filter((item) => item.id !== excludeId).slice(0, limit)
}
