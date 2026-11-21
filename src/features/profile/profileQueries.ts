import {
  useInfiniteQuery, useQuery,
  type InfiniteData, type UseInfiniteQueryResult, type UseQueryResult,
} from '@tanstack/react-query'
import { useAuth } from '@/app/AuthProvider'
import { qk } from '@/lib/queryKeys'
import { supabase } from '@/lib/supabase'
import { safeLimit, sliceToPage, unwrap, type Page } from '@/services/query'
import type { Database } from '@/types/database'

/**
 * Lectures propres au PROFIL PUBLIC.
 *
 * `src/services/posts.ts` et `src/services/map.ts` paginent par surface ou par
 * categorie, jamais par auteur : ces requetes-la n'existent pas encore cote
 * services, on les ecrit donc ici, avec les memes briques (`safeLimit`,
 * `sliceToPage`, `unwrap`) pour garder une pagination identique au reste de
 * l'application.
 *
 * Toutes les cles de cache derivent de `qk.profile(id)` : invalider un profil
 * invalide aussi ses listes, TanStack Query faisant une correspondance par
 * prefixe. Aucune cle n'est ajoutee a `src/lib/queryKeys.ts`, qui ne nous
 * appartient pas.
 */

type PostRow = Database['public']['Tables']['posts']['Row']
type PostMediaRow = Database['public']['Tables']['post_media']['Row']
type MarkerRow = Database['public']['Tables']['map_markers']['Row']
type PostSurface = Database['public']['Enums']['post_surface']

/** Une publication de l'auteur et ses médias, dans l'ordre d'affichage. */
export interface AuthorPost {
  post: PostRow
  media: PostMediaRow[]
}

/** Page courte : un profil se parcourt, il ne se deroule pas sans fin. */
const POSTS_PER_PAGE = 12
/** Au plus 6 vignettes retenues par publication. */
const MEDIA_PER_POST = 6
/** Les decouvertes validees d'un membre restent peu nombreuses. */
const MARKERS_LIMIT = 60

async function fetchAuthorPosts(
  authorId: string,
  surface: PostSurface,
  cursor: string | null,
): Promise<Page<AuthorPost>> {
  const size = safeLimit(POSTS_PER_PAGE)

  let query = supabase
    .from('posts')
    .select('*')
    .eq('author_id', authorId)
    .eq('surface', surface)
    // Une publication masquee par la moderation reste invisible sur le profil,
    // y compris pour son auteur : le profil est une vitrine publique.
    .eq('is_hidden', false)

  if (cursor) query = query.lt('created_at', cursor)

  const rows = unwrap(await query.order('created_at', { ascending: false }).limit(size + 1))
  const page = sliceToPage(rows, size, (row) => row.created_at)

  const ids = page.items.map((row) => row.id)
  const media = ids.length
    ? unwrap(
        await supabase
          .from('post_media')
          .select('*')
          .in('post_id', ids)
          .order('sort_order', { ascending: true })
          .limit(ids.length * MEDIA_PER_POST),
      )
    : []

  const grouped = new Map<string, PostMediaRow[]>()
  for (const item of media) {
    const list = grouped.get(item.post_id)
    if (list) list.push(item)
    else grouped.set(item.post_id, [item])
  }

  return {
    items: page.items.map((post) => ({ post, media: grouped.get(post.id) ?? [] })),
    nextCursor: page.nextCursor,
  }
}

/** Publications d'un membre sur une surface donnee, paginees par curseur. */
export function useAuthorPosts(
  authorId: string | null | undefined,
  surface: PostSurface,
): UseInfiniteQueryResult<InfiniteData<Page<AuthorPost>>, Error> {
  return useInfiniteQuery({
    queryKey: [...qk.profile(authorId ?? 'anonyme'), 'posts', surface],
    queryFn: ({ pageParam }) => fetchAuthorPosts(authorId as string, surface, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(authorId),
  })
}

/**
 * Decouvertes VALIDEES d'un membre.
 *
 * Volontairement limite a `status = 'approved'` : les brouillons et les
 * propositions en attente appartiennent au suivi personnel de leur auteur
 * (onglet « Mes contributions » de la carte), pas a une page publique.
 */
export function useAuthorMarkers(
  authorId: string | null | undefined,
): UseQueryResult<MarkerRow[]> {
  return useQuery({
    queryKey: [...qk.profile(authorId ?? 'anonyme'), 'markers', 'approved'],
    queryFn: async (): Promise<MarkerRow[]> =>
      unwrap(
        await supabase
          .from('map_markers')
          .select('*')
          .eq('author_id', authorId as string)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(MARKERS_LIMIT),
      ),
    enabled: Boolean(authorId),
  })
}

/** Statut LEONIDA+ d'un profil, et surtout : est-il CONNAISSABLE ? */
export interface PremiumStatus {
  /**
   * `false` quand l'abonnement d'autrui n'est pas interrogeable — c'est le cas
   * normal. La migration 0009 reserve `is_premium(uuid)` a l'appelant lui-meme
   * et au staff, precisement pour empecher l'enumeration des abonnes. On
   * n'affiche alors AUCUN badge, plutôt que d'en deduire une absence
   * d'abonnement qui serait inventee.
   */
  known: boolean
  isPremium: boolean
}

export function useProfilePremium(profileId: string | null | undefined): PremiumStatus {
  const { user, isStaff, isPremium } = useAuth()
  const isSelf = Boolean(profileId && user?.id === profileId)

  const staffLookup = useQuery({
    queryKey: qk.premium(profileId ?? 'anonyme'),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_premium', { _user_id: profileId as string })
      if (error) throw error
      return data === true
    },
    enabled: Boolean(profileId) && isStaff && !isSelf,
    staleTime: 5 * 60 * 1000,
  })

  if (isSelf) return { known: true, isPremium }
  if (isStaff && staffLookup.data !== undefined) {
    return { known: true, isPremium: staffLookup.data }
  }
  return { known: false, isPremium: false }
}
