import { useEffect, type ReactNode } from 'react'
import { Button, ErrorState, Icon } from '@/components/ui'
import { useIntersection } from '@/hooks/useIntersection'
import type { NewsCategory, NewsListItem } from '@/services/news'
import { NewsCard, NewsCardSkeleton } from './NewsCard'
import s from './NewsGrid.module.css'

export interface NewsGridProps {
  articles: NewsListItem[]
  /** Categories indexees par identifiant, resolues par la page. */
  categoriesById: Map<string, NewsCategory>
  isLoading: boolean
  error: unknown
  onRetry: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  /** Echec de la page SUIVANTE : les articles deja charges restent visibles. */
  nextPageError: unknown
  onLoadMore: () => void
  /** Etat vide fourni par la page : son texte depend des filtres actifs. */
  emptyState: ReactNode
}

/** Nombre de cartes fantomes au premier chargement : une grille deja credible. */
const SKELETON_COUNT = 6

export function NewsGrid({
  articles,
  categoriesById,
  isLoading,
  error,
  onRetry,
  hasNextPage,
  isFetchingNextPage,
  nextPageError,
  onLoadMore,
  emptyState,
}: NewsGridProps) {
  // Sentinelle de chargement progressif. Desactivee pendant une requete en
  // cours et apres un echec : on ne relance pas une requete qui vient
  // d'echouer, le bouton reprend la main.
  const sentinel = useIntersection({
    rootMargin: '400px',
    enabled: hasNextPage && !isFetchingNextPage && !nextPageError,
  })

  useEffect(() => {
    if (sentinel.isIntersecting && hasNextPage && !isFetchingNextPage && !nextPageError) {
      onLoadMore()
    }
  }, [sentinel.isIntersecting, hasNextPage, isFetchingNextPage, nextPageError, onLoadMore])

  if (isLoading) {
    return (
      <ul className={s.grid} aria-busy="true">
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <li key={index}>
            <NewsCardSkeleton />
          </li>
        ))}
      </ul>
    )
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        title="Actualités indisponibles"
        onRetry={onRetry}
      />
    )
  }

  if (articles.length === 0) return <>{emptyState}</>

  return (
    <>
      <p className={s.count} role="status">
        {articles.length === 1 ? '1 actualité affichée' : `${articles.length} actualités affichées`}
        {hasNextPage ? ' — il en reste a charger.' : null}
      </p>

      <ul className={s.grid}>
        {articles.map((article, index) => (
          // Seul le premier article est mis en avant : au-dela, plus rien ne
          // se detacherait et la grille redeviendrait uniforme.
          <li key={article.id} data-featured={index === 0 ? 'true' : undefined}>
            <NewsCard
              article={article}
              featured={index === 0}
              category={article.category_id ? categoriesById.get(article.category_id) ?? null : null}
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
            retryLabel="Reessayer"
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
              Charger plus d'actualités
            </Button>
            {/* Chargement anticipe : la sentinelle declenche la page suivante
                avant que le bouton n'entre dans l'ecran. */}
            <div ref={sentinel.ref} className={s.sentinel} aria-hidden="true" />
          </>
        ) : (
          <p className={s.end}>Vous avez atteint la fin du fil.</p>
        )}
      </div>
    </>
  )
}
