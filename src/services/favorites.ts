import { supabase } from '@/lib/supabase'
import { truncate } from '@/lib/format'
import type { Database } from '@/types/database'
import { safeLimit, unwrap, unwrapCount, unwrapVoid } from './query'

type FavoriteRow = Database['public']['Tables']['favorites']['Row']
type TargetType = Database['public']['Enums']['target_type']

export type Favorite = FavoriteRow

/** Les favoris sont PRIVES : aucune policy ne les expose a un autre membre. */
export async function listFavorites(
  userId: string,
  targetType?: TargetType,
  limit = 50,
): Promise<FavoriteRow[]> {
  let query = supabase.from('favorites').select('*').eq('user_id', userId)
  if (targetType) query = query.eq('target_type', targetType)
  return unwrap(await query.order('created_at', { ascending: false }).limit(safeLimit(limit)))
}

export async function isFavorite(
  userId: string,
  targetType: TargetType,
  targetId: string,
): Promise<boolean> {
  const count = unwrapCount(
    await supabase
      .from('favorites')
      .select('user_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .eq('target_id', targetId),
  )
  return count > 0
}

/**
 * Favoris du membre parmi une liste de contenus, en une seule requete.
 *
 * A utiliser dans un FEED plutot que `isFavorite` par ligne : vingt lignes
 * donneraient vingt requetes.
 */
export async function getMyFavoriteIds(
  userId: string,
  targetType: TargetType,
  targetIds: string[],
): Promise<Set<string>> {
  const unique = Array.from(new Set(targetIds))
  if (unique.length === 0) return new Set()

  const rows = unwrap(
    await supabase
      .from('favorites')
      .select('target_id')
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .in('target_id', unique)
      .limit(unique.length),
  )

  return new Set(rows.map((row) => row.target_id))
}

/** Renvoie l'etat final : `true` si le contenu est desormais en favori. */
export async function toggleFavorite(
  userId: string,
  targetType: TargetType,
  targetId: string,
): Promise<boolean> {
  const already = await isFavorite(userId, targetType, targetId)

  if (already) {
    unwrapVoid(
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('target_type', targetType)
        .eq('target_id', targetId),
    )
    return false
  }

  unwrapVoid(
    await supabase
      .from('favorites')
      .insert({ user_id: userId, target_type: targetType, target_id: targetId }),
  )
  return true
}

/* ============================================ RESOLUTION DES CIBLES ======= */

export interface FavoriteTarget {
  kind: TargetType
  id: string
  title: string
  /** Renseigne pour les contenus ouverts par slug (actualites, concours). */
  slug: string | null
  imageUrl: string | null
}

export interface FavoriteEntry {
  favorite: FavoriteRow
  /**
   * `null` quand la cible n'est plus lisible : contenu supprime, masque par la
   * moderation, ou commentaire (non resolu ici). L'interface doit afficher un
   * favori « contenu indisponible » plutot qu'une ligne vide.
   */
  target: FavoriteTarget | null
}

function idsOfKind(favorites: FavoriteRow[], kind: TargetType): string[] {
  return Array.from(
    new Set(favorites.filter((f) => f.target_type === kind).map((f) => f.target_id)),
  )
}

/**
 * Resout le titre et la vignette de chaque favori en quatre requetes
 * parallelisees et bornees (une par type de contenu), plutot qu'une requete
 * par ligne.
 */
export async function listFavoritesDetailed(
  userId: string,
  targetType?: TargetType,
  limit = 50,
): Promise<FavoriteEntry[]> {
  const favorites = await listFavorites(userId, targetType, limit)
  if (favorites.length === 0) return []

  const postIds = idsOfKind(favorites, 'post')
  const newsIds = idsOfKind(favorites, 'news')
  const markerIds = idsOfKind(favorites, 'marker')
  const contestIds = idsOfKind(favorites, 'contest')

  const [posts, postMedia, news, markers, contests] = await Promise.all([
    postIds.length
      ? supabase.from('posts').select('id,title,body').in('id', postIds).limit(postIds.length)
      : null,
    postIds.length
      ? supabase
          .from('post_media')
          .select('post_id,url')
          .in('post_id', postIds)
          .eq('kind', 'image')
          .order('sort_order', { ascending: true })
          .limit(postIds.length * 4)
      : null,
    newsIds.length
      ? supabase
          .from('news_articles')
          .select('id,slug,title,cover_url')
          .in('id', newsIds)
          .limit(newsIds.length)
      : null,
    markerIds.length
      ? supabase
          .from('map_markers')
          .select('id,title,image_url')
          .in('id', markerIds)
          .limit(markerIds.length)
      : null,
    contestIds.length
      ? supabase
          .from('contests')
          .select('id,slug,title,image_url')
          .in('id', contestIds)
          .limit(contestIds.length)
      : null,
  ])

  const targets = new Map<string, FavoriteTarget>()
  const key = (kind: TargetType, id: string) => `${kind}:${id}`

  const cover = new Map<string, string>()
  if (postMedia) {
    for (const media of unwrap(postMedia)) {
      if (!cover.has(media.post_id)) cover.set(media.post_id, media.url)
    }
  }

  if (posts) {
    for (const row of unwrap(posts)) {
      targets.set(key('post', row.id), {
        kind: 'post',
        id: row.id,
        title: row.title?.trim() || truncate(row.body, 70) || 'Publication',
        slug: null,
        imageUrl: cover.get(row.id) ?? null,
      })
    }
  }

  if (news) {
    for (const row of unwrap(news)) {
      targets.set(key('news', row.id), {
        kind: 'news',
        id: row.id,
        title: row.title,
        slug: row.slug,
        imageUrl: row.cover_url,
      })
    }
  }

  if (markers) {
    for (const row of unwrap(markers)) {
      targets.set(key('marker', row.id), {
        kind: 'marker',
        id: row.id,
        title: row.title,
        slug: null,
        imageUrl: row.image_url,
      })
    }
  }

  if (contests) {
    for (const row of unwrap(contests)) {
      targets.set(key('contest', row.id), {
        kind: 'contest',
        id: row.id,
        title: row.title,
        slug: row.slug,
        imageUrl: row.image_url,
      })
    }
  }

  return favorites.map((favorite) => ({
    favorite,
    target: targets.get(key(favorite.target_type, favorite.target_id)) ?? null,
  }))
}
