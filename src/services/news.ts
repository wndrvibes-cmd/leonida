import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { attachAuthor, type WithAuthor } from './authors'
import {
  ilikeValue, isPermissionDenied, MIN_SEARCH_LENGTH, safeLimit, sanitizeSearch,
  unwrap, unwrapMaybe, type Page,
} from './query'

type NewsRow = Database['public']['Tables']['news_articles']['Row']
type NewsMediaRow = Database['public']['Tables']['news_media']['Row']
type NewsCategoryRow = Database['public']['Tables']['news_categories']['Row']

export type NewsArticle = NewsRow
export type NewsCategory = NewsCategoryRow
export type NewsMedia = NewsMediaRow

/**
 * Colonnes de liste : `body` est volontairement exclu (un article complet peut
 * peser plusieurs dizaines de ko, inutile dans un fil).
 */
/* Doit rester une SEULE chaine litterale : supabase-js deduit le type des
   lignes en analysant ce texte. Une concatenation (`'a,' + 'b'`) le degrade en
   `string` et la requete perd tout typage. */
const NEWS_LIST_COLUMNS = 'id,slug,title,excerpt,cover_url,category_id,author_id,source_name,source_url,reliability,status,published_at,tags,view_count,allow_comments,created_at' as const

export type NewsListItem = Pick<
  NewsRow,
  | 'id' | 'slug' | 'title' | 'excerpt' | 'cover_url' | 'category_id' | 'author_id'
  | 'source_name' | 'source_url' | 'reliability' | 'status' | 'published_at'
  | 'tags' | 'view_count' | 'allow_comments' | 'created_at'
>

export interface ListNewsOptions {
  /** Identifiant de categorie (voir `listCategories` / `getCategoryIdBySlug`). */
  categoryId?: string
  tag?: string
  q?: string
  cursor?: string | null
  limit?: number
}

/* ============================================================= CURSEUR ==== */

/**
 * `published_at` est NULLABLE en base : un article peut etre publie sans date.
 * Un simple curseur `published_at < x` ferait disparaitre ces articles de
 * toutes les pages suivantes. On pagine donc en deux phases explicites :
 *
 *   phase `d` — articles dates, tries par `published_at` decroissant ;
 *   phase `u` — articles sans date, tries par `created_at` decroissant.
 *
 * La page frontiere complete la phase datee avec les premiers articles sans
 * date, et la phase du curseur suivant se deduit de la derniere ligne rendue.
 */
type NewsCursor = { phase: 'dated' | 'undated'; date: string }

function encodeNewsCursor(cursor: NewsCursor): string {
  return `${cursor.phase === 'dated' ? 'd' : 'u'}:${cursor.date}`
}

function decodeNewsCursor(raw: string | null | undefined): NewsCursor | null {
  if (!raw || raw.length < 3) return null
  const prefix = raw.slice(0, 2)
  const date = raw.slice(2)
  if (!date) return null
  if (prefix === 'd:') return { phase: 'dated', date }
  if (prefix === 'u:') return { phase: 'undated', date }
  return null
}

function baseNewsQuery(options: ListNewsOptions) {
  let query = supabase
    .from('news_articles')
    .select(NEWS_LIST_COLUMNS)
    // Filtre explicite : la RLS laisse le staff voir les brouillons, ils n'ont
    // pas a apparaitre dans le fil public.
    .eq('status', 'published')

  if (options.categoryId) query = query.eq('category_id', options.categoryId)
  if (options.tag) query = query.contains('tags', [options.tag])

  const term = sanitizeSearch(options.q)
  if (term.length >= MIN_SEARCH_LENGTH) {
    const value = ilikeValue(term)
    query = query.or(`title.ilike.${value},excerpt.ilike.${value}`)
  }

  return query
}

/** Type du constructeur de requete, pour pouvoir le reaffecter plus bas. */
type NewsQuery = ReturnType<typeof baseNewsQuery>

async function fetchDated(
  options: ListNewsOptions,
  count: number,
  after: string | null,
): Promise<NewsListItem[]> {
  let query: NewsQuery = baseNewsQuery(options).not('published_at', 'is', null)
  if (after) query = query.lt('published_at', after)
  return unwrap(await query.order('published_at', { ascending: false }).limit(count))
}

async function fetchUndated(
  options: ListNewsOptions,
  count: number,
  after: string | null,
): Promise<NewsListItem[]> {
  if (count <= 0) return []
  let query: NewsQuery = baseNewsQuery(options).is('published_at', null)
  if (after) query = query.lt('created_at', after)
  return unwrap(await query.order('created_at', { ascending: false }).limit(count))
}

export async function listNews(options: ListNewsOptions = {}): Promise<Page<NewsListItem>> {
  const limit = safeLimit(options.limit)
  const want = limit + 1
  const cursor = decodeNewsCursor(options.cursor)

  let rows: NewsListItem[]
  if (cursor?.phase === 'undated') {
    rows = await fetchUndated(options, want, cursor.date)
  } else {
    rows = await fetchDated(options, want, cursor?.date ?? null)
    if (rows.length < want) {
      rows = rows.concat(await fetchUndated(options, want - rows.length, null))
    }
  }

  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows
  const last = items.length > 0 ? items[items.length - 1] : undefined

  const nextCursor =
    hasMore && last
      ? encodeNewsCursor(
          last.published_at
            ? { phase: 'dated', date: last.published_at }
            : { phase: 'undated', date: last.created_at },
        )
      : null

  return { items, nextCursor }
}

/* ============================================================= DETAIL ===== */

export type NewsArticleDetail = WithAuthor<NewsRow> & {
  media: NewsMediaRow[]
  category: NewsCategoryRow | null
}

/** `null` si l'article n'existe pas ou n'est pas encore visible. */
export async function getArticleBySlug(slug: string): Promise<NewsArticleDetail | null> {
  const article = unwrapMaybe(
    await supabase.from('news_articles').select('*').eq('slug', slug).maybeSingle(),
  )
  if (!article) return null

  const [withAuthor, media, category] = await Promise.all([
    attachAuthor(article, (row) => row.author_id),
    supabase
      .from('news_media')
      .select('*')
      .eq('article_id', article.id)
      .order('sort_order', { ascending: true })
      .limit(40),
    article.category_id
      ? supabase.from('news_categories').select('*').eq('id', article.category_id).maybeSingle()
      : null,
  ])

  return {
    ...withAuthor,
    media: unwrap(media),
    category: category ? unwrapMaybe(category) : null,
  }
}

/* ========================================================== CATEGORIES ==== */

export async function listCategories(): Promise<NewsCategoryRow[]> {
  return unwrap(
    await supabase
      .from('news_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(50),
  )
}

export async function getCategoryIdBySlug(slug: string): Promise<string | null> {
  const row = unwrapMaybe(
    await supabase.from('news_categories').select('id').eq('slug', slug).maybeSingle(),
  )
  return row?.id ?? null
}

/* =============================================================== VUES ===== */

/**
 * Incremente le compteur de vues.
 *
 * LIMITE ASSUMEE : `news_articles` n'accepte en ecriture que le staff
 * (policy `news_update_staff`) et aucune fonction SECURITY DEFINER n'existe
 * pour ce compteur. Pour un visiteur, la base refuse donc l'ecriture et la
 * fonction renvoie `false` sans faire echouer l'affichage de l'article.
 * Tant qu'une RPC dediee n'est pas ajoutee, `view_count` ne reflete pas
 * l'audience reelle : ne pas le presenter comme tel dans l'interface.
 */
export async function incrementView(articleId: string): Promise<boolean> {
  try {
    const current = unwrapMaybe(
      await supabase.from('news_articles').select('view_count').eq('id', articleId).maybeSingle(),
    )
    if (!current) return false

    const { error } = await supabase
      .from('news_articles')
      .update({ view_count: current.view_count + 1 })
      .eq('id', articleId)

    if (error) {
      if (isPermissionDenied(error)) return false
      throw error
    }
    return true
  } catch (error) {
    if (isPermissionDenied(error)) return false
    // Une vue non comptee ne doit jamais casser la lecture d'un article.
    return false
  }
}
