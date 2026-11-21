import {
  useInfiniteQuery, useMutation, useQuery, useQueryClient, type UseQueryResult,
} from '@tanstack/react-query'
import { useAuth } from '@/app/AuthProvider'
import { qk } from '@/lib/queryKeys'
import type { UploadedImage } from '@/lib/upload'
import {
  attachMedia, createPost, deletePost, getPost, updatePost,
  type AttachMediaInput, type Post, type PostListItem,
} from '@/services/posts'
import { MIN_SEARCH_LENGTH, sanitizeSearch } from '@/services/query'
import { toggleReaction } from '@/services/reactions'
import type { Database } from '@/types/database'
import { sortForTab, typeForTab, type CommunityFilters } from './communityFilters'
import { fetchCommunityPage } from './communityQueries'

type PostType = Database['public']['Enums']['post_type']
type ReactionType = Database['public']['Enums']['reaction_type']

/** Taille de page du fil : un premier ecran rapide sur reseau mobile. */
export const COMMUNITY_PAGE_SIZE = 12

/* ================================================================ LECTURE = */

/**
 * Fil pagine par curseur.
 *
 * La cle de cache porte les filtres REELLEMENT envoyes a la base (type impose
 * par l'onglet compris) : deux etats d'interface qui produisent la meme
 * requete partagent donc la meme entree de cache.
 */
export function useCommunityFeed(filters: CommunityFilters) {
  const term = sanitizeSearch(filters.q)
  const q = term.length >= MIN_SEARCH_LENGTH ? term : undefined
  const type = typeForTab(filters.tab, filters.type)
  const sort = sortForTab(filters.tab)
  const tag = filters.tag || undefined

  return useInfiniteQuery({
    queryKey: qk.posts({
      surface: 'community',
      type: type ?? '',
      tag: tag ?? '',
      q: q ?? '',
      sort,
    }),
    queryFn: ({ pageParam }) =>
      fetchCommunityPage({ type, tag, q, sort, cursor: pageParam, limit: COMMUNITY_PAGE_SIZE }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}

/** `data === null` est un cas NORMAL : identifiant inconnu, ou publication masquee. */
export function usePost(id: string | undefined): UseQueryResult<PostListItem | null> {
  return useQuery({
    queryKey: qk.post(id ?? ''),
    queryFn: () => getPost(id as string),
    enabled: Boolean(id),
  })
}

/* =============================================================== ECRITURE = */

function useFeedInvalidation() {
  const queryClient = useQueryClient()

  return (postId?: string) => {
    void queryClient.invalidateQueries({ queryKey: qk.posts() })
    if (postId) void queryClient.invalidateQueries({ queryKey: qk.post(postId) })
  }
}

export interface NewCommunityPost {
  postType: PostType
  title: string
  body: string
  tags: string[]
  /** Images deja televersees dans le bucket `posts`. */
  images: UploadedImage[]
  /** Lien YouTube/Twitch canonique, ou `null`. */
  videoUrl: string | null
}

export interface CreatedCommunityPost {
  post: Post
  /**
   * Non nul quand la publication est bien creee mais que le rattachement des
   * medias a echoue. Ce n'est PAS un echec complet : l'interface doit le dire
   * tel quel plutot que de proposer un nouvel envoi qui ferait un doublon.
   */
  mediaError: unknown
}

/**
 * Publication d'un message communautaire.
 *
 * Deux ecritures successives, car la base les separe : la ligne `posts` puis
 * ses `post_media`. L'ordre est impose — `post_media.post_id` est une cle
 * etrangere, et la policy `post_media_write_own` verifie que la publication
 * appartient bien a l'appelant.
 */
export function useCreateCommunityPost() {
  const { user } = useAuth()
  const invalidate = useFeedInvalidation()

  return useMutation<CreatedCommunityPost, Error, NewCommunityPost>({
    mutationFn: async (input) => {
      if (!user) throw new Error('Vous devez etre connecte pour publier.')

      const post = await createPost({
        authorId: user.id,
        surface: 'community',
        postType: input.postType,
        title: input.title,
        body: input.body,
        tags: input.tags,
      })

      const media: AttachMediaInput[] = [
        ...input.images.map((image) => ({
          url: image.url,
          kind: 'image' as const,
          width: image.width || null,
          height: image.height || null,
        })),
        ...(input.videoUrl ? [{ url: input.videoUrl, kind: 'video_link' as const }] : []),
      ]

      if (media.length === 0) return { post, mediaError: null }

      try {
        await attachMedia(post.id, media)
        return { post, mediaError: null }
      } catch (error) {
        return { post, mediaError: error }
      }
    },
    onSuccess: (result) => invalidate(result.post.id),
  })
}

export interface EditedCommunityPost {
  postType: PostType
  title: string
  body: string
  tags: string[]
}

/**
 * Modification par l'auteur. Les medias ne sont pas touches : ils vivent dans
 * `post_media`, et le declencheur `tg_protect_post_fields` rend de toute
 * facon les compteurs et l'epinglage inaccessibles a un non-staff.
 */
export function useUpdateCommunityPost(postId: string) {
  const invalidate = useFeedInvalidation()

  return useMutation<Post, Error, EditedCommunityPost>({
    mutationFn: (input) =>
      updatePost(postId, {
        postType: input.postType,
        title: input.title,
        body: input.body,
        tags: input.tags,
      }),
    onSuccess: () => invalidate(postId),
  })
}

/**
 * Suppression par l'auteur. Les lignes `post_media`, commentaires, reactions
 * et favoris partent avec elle (`on delete cascade`) ; les fichiers du bucket
 * `posts`, eux, restent — aucune fonction du socle ne les supprime, et
 * inventer ici un balayage de storage serait hors de ma zone.
 */
export function useDeleteCommunityPost(postId: string) {
  const invalidate = useFeedInvalidation()

  return useMutation<void, Error, void>({
    mutationFn: () => deletePost(postId),
    onSuccess: () => invalidate(postId),
  })
}

export interface QuickReactionInput {
  postId: string
  reaction: ReactionType
  /** Reaction actuelle du membre, connue par le lot `useMyReactions`. */
  current: ReactionType | null
}

/**
 * Reaction depuis le FIL.
 *
 * `useToggleReaction` (socle) deduit l'etat courant du cache de
 * `useReactionSummary`, qui coute six requetes par publication et n'a donc
 * pas sa place dans une liste. Ici l'etat courant est fourni par le lot
 * `useMyReactions` — une seule requete pour toute la page — et transmis
 * explicitement a `toggleReaction()`, la fonction du socle prevue pour cela.
 */
export function usePostQuickReaction() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation<ReactionType | null, Error, QuickReactionInput>({
    mutationFn: ({ postId, reaction, current }) => {
      if (!user) throw new Error('Vous devez etre connecte pour reagir.')
      return toggleReaction(user.id, 'post', postId, reaction, current)
    },
    onSuccess: (_result, variables) => {
      // Lots de reactions du membre (prefixe commun a toutes les signatures).
      void queryClient.invalidateQueries({ queryKey: qk.reactions('post', 'mine') })
      // `reaction_count` est recalcule par un declencheur : le fil doit suivre.
      void queryClient.invalidateQueries({ queryKey: qk.posts() })
      void queryClient.invalidateQueries({ queryKey: qk.post(variables.postId) })
    },
  })
}
