import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { attachAuthor, attachAuthors, type WithAuthor } from './authors'
import {
  decodeRankCursor, encodeRankCursor, safeLimit, sliceToPage, unwrap, unwrapMaybe,
  unwrapVoid, type Page,
} from './query'

type PostRow = Database['public']['Tables']['posts']['Row']
type PostMediaRow = Database['public']['Tables']['post_media']['Row']
type PostSurface = Database['public']['Enums']['post_surface']
type PostType = Database['public']['Enums']['post_type']
type MediaKind = Database['public']['Enums']['media_kind']

export type Post = PostRow
export type PostMedia = PostMediaRow
export type PostSort = 'recent' | 'popular'

export type PostListItem = WithAuthor<PostRow> & { media: PostMediaRow[] }

export interface ListPostsOptions {
  surface?: PostSurface
  type?: PostType
  tag?: string
  sort?: PostSort
  cursor?: string | null
  limit?: number
}

/** Au plus 12 medias par publication : borne le volume d'une page de feed. */
const MEDIA_PER_POST = 12

async function fetchMediaByPost(postIds: string[]): Promise<Map<string, PostMediaRow[]>> {
  const grouped = new Map<string, PostMediaRow[]>()
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
 * Feed pagine PAR CURSEUR, jamais par `offset` : sur un fil ou l'on publie
 * pendant la lecture, l'offset rejoue ou saute des lignes.
 *
 *   - tri `recent`  : curseur = `created_at` (index posts_feed_idx) ;
 *   - tri `popular` : curseur composite `reaction_count~created_at`, car des
 *     centaines de publications partagent le meme nombre de reactions
 *     (index posts_popular_idx).
 *
 * Les publications masquees sont exclues explicitement : la RLS laisse un
 * auteur voir les siennes, elles n'ont pourtant rien a faire dans un feed.
 */
export async function listPosts(options: ListPostsOptions = {}): Promise<Page<PostListItem>> {
  const { surface, type, tag, sort = 'recent', cursor = null } = options
  const limit = safeLimit(options.limit)

  let query = supabase.from('posts').select('*').eq('is_hidden', false)

  if (surface) query = query.eq('surface', surface)
  if (type) query = query.eq('post_type', type)
  if (tag) query = query.contains('tags', [tag])

  if (sort === 'popular') {
    const decoded = decodeRankCursor(cursor)
    if (decoded) {
      query = query.or(
        `reaction_count.lt.${decoded.rank},` +
          `and(reaction_count.eq.${decoded.rank},created_at.lt.${decoded.date})`,
      )
    }
    query = query
      .order('reaction_count', { ascending: false })
      .order('created_at', { ascending: false })
  } else {
    if (cursor) query = query.lt('created_at', cursor)
    query = query.order('created_at', { ascending: false })
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
 * Publications epinglees d'une surface. Separees du feed : melanger
 * `is_pinned` au tri casserait la pagination par curseur.
 */
export async function listPinnedPosts(surface: PostSurface, limit = 3): Promise<PostListItem[]> {
  const rows = unwrap(
    await supabase
      .from('posts')
      .select('*')
      .eq('surface', surface)
      .eq('is_hidden', false)
      .eq('is_pinned', true)
      .order('created_at', { ascending: false })
      .limit(safeLimit(limit)),
  )

  const withAuthors = await attachAuthors(rows, (row) => row.author_id)
  const media = await fetchMediaByPost(withAuthors.map((row) => row.id))
  return withAuthors.map((row) => ({ ...row, media: media.get(row.id) ?? [] }))
}

/** `null` si la publication n'existe pas ou n'est pas visible par l'appelant. */
export async function getPost(id: string): Promise<PostListItem | null> {
  const post = unwrapMaybe(await supabase.from('posts').select('*').eq('id', id).maybeSingle())
  if (!post) return null

  const [withAuthor, media] = await Promise.all([
    attachAuthor(post, (row) => row.author_id),
    fetchMediaByPost([post.id]),
  ])

  return { ...withAuthor, media: media.get(post.id) ?? [] }
}

/* ================================================================ ECRITURE = */

export interface CreatePostInput {
  /** Doit etre l'identifiant du membre connecte : la RLS le verifie. */
  authorId: string
  surface: PostSurface
  postType: PostType
  title?: string | null
  body?: string | null
  tags?: string[]
}

export async function createPost(input: CreatePostInput): Promise<PostRow> {
  return unwrap(
    await supabase
      .from('posts')
      .insert({
        author_id: input.authorId,
        surface: input.surface,
        post_type: input.postType,
        title: input.title?.trim() || null,
        body: input.body?.trim() || null,
        tags: input.tags ?? [],
      })
      .select('*')
      .single(),
  )
}

/**
 * Champs modifiables par l'auteur. `is_pinned`, `is_hidden` et les compteurs
 * sont absents : `tg_protect_post_fields` les restaure cote base pour un
 * non-staff.
 */
export interface UpdatePostInput {
  title?: string | null
  body?: string | null
  tags?: string[]
  postType?: PostType
}

export async function updatePost(id: string, patch: UpdatePostInput): Promise<PostRow> {
  const row = unwrapMaybe(
    await supabase
      .from('posts')
      .update({
        ...(patch.title !== undefined ? { title: patch.title?.trim() || null } : {}),
        ...(patch.body !== undefined ? { body: patch.body?.trim() || null } : {}),
        ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
        ...(patch.postType !== undefined ? { post_type: patch.postType } : {}),
      })
      .eq('id', id)
      .select('*')
      .maybeSingle(),
  )
  if (!row) throw new Error('Publication introuvable ou modification refusée.')
  return row
}

export async function deletePost(id: string): Promise<void> {
  unwrapVoid(await supabase.from('posts').delete().eq('id', id))
}

export interface AttachMediaInput {
  url: string
  kind?: MediaKind
  caption?: string | null
  width?: number | null
  height?: number | null
}

/**
 * Rattache des medias deja televerses (voir `@/lib/upload`) a une publication.
 * L'ordre du tableau devient `sort_order`.
 */
export async function attachMedia(
  postId: string,
  items: AttachMediaInput[],
): Promise<PostMediaRow[]> {
  if (items.length === 0) return []

  return unwrap(
    await supabase
      .from('post_media')
      .insert(
        items.map((item, index) => ({
          post_id: postId,
          url: item.url,
          kind: item.kind ?? 'image',
          caption: item.caption ?? null,
          width: item.width ?? null,
          height: item.height ?? null,
          sort_order: index,
        })),
      )
      .select('*'),
  )
}

/** Detache un media d'une publication. Ne touche pas au fichier du bucket :
    utiliser `deleteUpload` de `@/lib/upload` pour cela. */
export async function deletePostMedia(mediaId: string): Promise<void> {
  unwrapVoid(await supabase.from('post_media').delete().eq('id', mediaId))
}
