import { supabase } from '@/lib/supabase'
import { attachAuthors } from '@/services/authors'
import { listPosts, type PostListItem, type PostMedia, type PostSort } from '@/services/posts'
import {
  decodeRankCursor, encodeRankCursor, ilikeValue, MIN_SEARCH_LENGTH, safeLimit,
  sanitizeSearch, sliceToPage, unwrap, type Page,
} from '@/services/query'
import type { Database } from '@/types/database'

/**
 * Acces liste du fil communautaire.
 *
 * POURQUOI CE FICHIER EXISTE : `listPosts()` (socle, gele) sait filtrer par
 * surface, type et tag et trier par date ou par reactions — tout ce dont le
 * fil a besoin SAUF la recherche plein texte. Comme /actualites avec
 * `newsQueries.ts`, la requete manquante vit donc ici, dans la zone du module.
 *
 * Deux chemins, un seul contrat de sortie (`Page<PostListItem>`) :
 *   - sans terme de recherche utilisable, on APPELLE `listPosts()` : aucune
 *     logique dupliquee, memes index, memes curseurs ;
 *   - avec un terme, la requete est reconstruite ici pour ajouter le
 *     `ilike`, en reprenant exactement le meme encodage de curseur.
 */

type PostType = Database['public']['Enums']['post_type']

/** Surface traitee par ce module. `moment` appartient a l'ecran Moments. */
const SURFACE = 'community' as const

/** Au plus 12 medias par publication, comme dans `services/posts.ts`. */
const MEDIA_PER_POST = 12

export interface CommunityQueryOptions {
  type?: PostType
  tag?: string
  /** Terme brut saisi par le membre : assaini ici. */
  q?: string
  sort?: PostSort
  cursor?: string | null
  limit?: number
}

/* Une SEULE chaine litterale : supabase-js deduit le type des lignes en
   analysant ce texte. */
const POST_COLUMNS = '*' as const

/**
 * Medias d'une page de publications, en une requete.
 *
 * `fetchMediaByPost` existe dans `services/posts.ts` mais n'y est pas
 * exportee ; ces huit lignes sont le seul emprunt au socle, et elles en
 * reprennent la borne (`MEDIA_PER_POST`) et l'ordre (`sort_order`).
 */
async function fetchMediaByPost(postIds: string[]): Promise<Map<string, PostMedia[]>> {
  const grouped = new Map<string, PostMedia[]>()
  if (postIds.length === 0) return grouped

  const rows = unwrap(
    await supabase
      .from('post_media')
      .select('*')
      .in('post_id', postIds)
      .order('sort_order', { ascending: true })
      .limit(postIds.length * MEDIA_PER_POST),
  )

  for (const row of rows) {
    const list = grouped.get(row.post_id)
    if (list) list.push(row)
    else grouped.set(row.post_id, [row])
  }
  return grouped
}

/**
 * Branches du curseur de popularite : rang strictement inferieur, ou rang
 * egal et date anterieure. Identique a `listPosts()`.
 */
function popularCursorBranches(cursor: string | null | undefined): string[] {
  const decoded = decodeRankCursor(cursor)
  if (!decoded) return []
  return [
    `reaction_count.lt.${decoded.rank}`,
    `and(reaction_count.eq.${decoded.rank},created_at.lt.${decoded.date})`,
  ]
}

/**
 * Combine deux conditions PostgREST en une conjonction a plat.
 *
 * POURQUOI CETTE GYMNASTIQUE : le curseur de popularite est une disjonction,
 * la recherche aussi. Deux appels `.or()` sur la meme requete produiraient
 * deux parametres `or=` dont la combinaison depend de l'interpretation du
 * serveur. On developpe donc le produit des deux disjonctions en un UNIQUE
 * `or(...)` de conjonctions, forme explicite et sans ambiguite.
 */
function mergeAnd(left: string, right: string): string {
  const inner = left.startsWith('and(') ? left.slice(4, -1) : left
  return `and(${inner},${right})`
}

async function searchPage(
  options: CommunityQueryOptions,
  term: string,
): Promise<Page<PostListItem>> {
  const { type, tag, sort = 'recent', cursor = null } = options
  const limit = safeLimit(options.limit)
  const value = ilikeValue(term)
  const searchBranches = [`title.ilike.${value}`, `body.ilike.${value}`]

  let query = supabase
    .from('posts')
    .select(POST_COLUMNS)
    .eq('surface', SURFACE)
    .eq('is_hidden', false)

  if (type) query = query.eq('post_type', type)
  if (tag) query = query.contains('tags', [tag])

  if (sort === 'popular') {
    const cursorBranches = popularCursorBranches(cursor)
    const branches =
      cursorBranches.length === 0
        ? searchBranches
        : cursorBranches.flatMap((branch) => searchBranches.map((search) => mergeAnd(branch, search)))

    query = query
      .or(branches.join(','))
      .order('reaction_count', { ascending: false })
      .order('created_at', { ascending: false })
  } else {
    if (cursor) query = query.lt('created_at', cursor)
    query = query.or(searchBranches.join(',')).order('created_at', { ascending: false })
  }

  const rows = unwrap(await query.limit(limit + 1))

  const page = sliceToPage(rows, limit, (row) =>
    sort === 'popular' ? encodeRankCursor(row.reaction_count, row.created_at) : row.created_at,
  )

  const withAuthors = await attachAuthors(page.items, (row) => row.author_id)
  const media = await fetchMediaByPost(withAuthors.map((row) => row.id))

  return {
    items: withAuthors.map((row) => ({ ...row, media: media.get(row.id) ?? [] })),
    nextCursor: page.nextCursor,
  }
}

/**
 * Une page du fil communautaire. Le terme de recherche est ignore en dessous
 * de `MIN_SEARCH_LENGTH` : en dessous, toute la table remonterait.
 */
export async function fetchCommunityPage(
  options: CommunityQueryOptions = {},
): Promise<Page<PostListItem>> {
  const term = sanitizeSearch(options.q)

  if (term.length < MIN_SEARCH_LENGTH) {
    return listPosts({
      surface: SURFACE,
      type: options.type,
      tag: options.tag,
      sort: options.sort,
      cursor: options.cursor,
      limit: options.limit,
    })
  }

  return searchPage(options, term)
}

/**
 * Tags les plus presents dans les publications DEJA CHARGEES.
 *
 * Volontairement derive du fil visible, et jamais presente comme « les tags
 * populaires du site » : compter les tags de toute la base demanderait une
 * agregation que PostgREST ne sait pas faire sans vue dediee.
 */
export function collectTags(posts: PostListItem[], max = 12): string[] {
  const counts = new Map<string, number>()
  for (const post of posts) {
    for (const tag of post.tags) {
      if (!tag) continue
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'))
    .slice(0, max)
    .map(([tag]) => tag)
}
