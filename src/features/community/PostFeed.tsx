import { useEffect, useMemo, type ReactNode } from 'react'
import { Button, ErrorState, Icon } from '@/components/ui'
import { useIntersection } from '@/hooks/useIntersection'
import { useMyReactions } from '@/hooks/useReactions'
import type { PostListItem } from '@/services/posts'
import { PostCard, PostCardSkeleton } from './PostCard'
import s from './PostFeed.module.css'

export interface PostFeedProps {
  posts: PostListItem[]
  isLoading: boolean
  error: unknown
  onRetry: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  /** Echec de la page SUIVANTE : le fil deja lu reste a l'ecran. */
  nextPageError: unknown
  onLoadMore: () => void
  /** Etat vide fourni par la page : son texte depend des filtres actifs. */
  emptyState: ReactNode
  onTagSelect?: (tag: string) => void
  onEdit?: (post: PostListItem) => void
  onDelete?: (post: PostListItem) => void
}

/** Cartes fantomes au premier chargement : un fil deja credible. */
const SKELETON_COUNT = 4

/**
 * Liste du fil communautaire.
 *
 * Les reactions du membre sont chargees en UN SEUL lot pour toute la page
 * (`useMyReactions`), jamais une requete par carte : voir l'avertissement en
 * tete de `src/services/reactions.ts`.
 */
export function PostFeed({
  posts,
  isLoading,
  error,
  onRetry,
  hasNextPage,
  isFetchingNextPage,
  nextPageError,
  onLoadMore,
  emptyState,
  onTagSelect,
  onEdit,
  onDelete,
}: PostFeedProps) {
  const ids = useMemo(() => posts.map((post) => post.id), [posts])
  const reactions = useMyReactions('post', ids)

  // Sentinelle de chargement progressif, neutralisee pendant une requete et
  // apres un echec : on ne relance pas ce qui vient d'echouer, le bouton
  // reprend la main.
  const sentinel = useIntersection({
    rootMargin: '500px',
    enabled: hasNextPage && !isFetchingNextPage && !nextPageError,
  })

  useEffect(() => {
    if (sentinel.isIntersecting && hasNextPage && !isFetchingNextPage && !nextPageError) {
      onLoadMore()
    }
  }, [sentinel.isIntersecting, hasNextPage, isFetchingNextPage, nextPageError, onLoadMore])

  if (isLoading) {
    return (
      <ul className={s.list} aria-busy="true">
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <li key={index}>
            <PostCardSkeleton />
          </li>
        ))}
      </ul>
    )
  }

  if (error) {
    return <ErrorState error={error} title="Fil indisponible" onRetry={onRetry} />
  }

  if (posts.length === 0) return <>{emptyState}</>

  return (
    <>
      <p className={s.count} role="status">
        {posts.length === 1 ? '1 publication affichée' : `${posts.length} publications affichees`}
        {hasNextPage ? ' — il en reste a charger.' : null}
      </p>

      <ul className={s.list}>
        {posts.map((post) => (
          <li key={post.id}>
            <PostCard
              post={post}
              myReaction={reactions.data?.get(post.id) ?? null}
              reactionsLoading={reactions.isLoading}
              onTagSelect={onTagSelect}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </li>
        ))}
      </ul>

      <div className={s.more}>
        {nextPageError ? (
          <ErrorState
            compact
            error={nextPageError}
            title="Chargement de la suite impossible"
            onRetry={onLoadMore}
          />
        ) : hasNextPage ? (
          <>
            <Button
              variant="secondary"
              size="lg"
              loading={isFetchingNextPage}
              onClick={onLoadMore}
              iconLeft={<Icon name="chevron-down" size={18} />}
            >
              Charger plus de publications
            </Button>
            {/* Chargement anticipe : la sentinelle part avant que le bouton
                n'entre dans l'ecran. */}
            <div ref={sentinel.ref} className={s.sentinel} aria-hidden="true" />
          </>
        ) : (
          <p className={s.end}>Vous avez atteint la fin du fil.</p>
        )}
      </div>
    </>
  )
}
