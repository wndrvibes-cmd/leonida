/**
 * Rubrique actualites de LEONIDA.
 *
 * Deux ecrans la consomment :
 *   `src/pages/NewsPage.tsx`        — le fil /actualites (recherche, filtres, tri,
 *                                     chargement progressif par curseur) ;
 *   `src/pages/NewsArticlePage.tsx` — l'article /actualites/:slug.
 *
 * Chaque article affiche sa SOURCE et son niveau de FIABILITE : une rumeur est
 * annoncee comme telle via `RELIABILITY_LABELS`, jamais presentee comme un
 * fait. Rien n'est invente ici — et `news_articles.view_count` n'est affiche
 * nulle part, parce que la base n'autorise son incrementation qu'au staff : ce
 * compteur ne refletant pas l'audience réelle, l'exposer serait mentir.
 *
 * Les feuilles de style restent importees par chemin direct : un module CSS
 * n'a pas sa place dans un barillet.
 */

/* --------------------------------------------------------------- AFFICHAGE */

export { NewsCard, NewsCardSkeleton } from './NewsCard'
export type { NewsCardProps } from './NewsCard'

export { NewsGrid } from './NewsGrid'
export type { NewsGridProps } from './NewsGrid'

export { NewsFilterBar } from './NewsFilterBar'
export type { NewsFilterBarProps } from './NewsFilterBar'

export { ReliabilityBadge } from './ReliabilityBadge'
export type { ReliabilityBadgeProps } from './ReliabilityBadge'

export { ReliabilityLegend } from './ReliabilityLegend'

/* ----------------------------------------------------------------- ARTICLE */

export { ArticleBody } from './ArticleBody'
export type { ArticleBodyProps } from './ArticleBody'

export { ArticleGallery } from './ArticleGallery'
export type { ArticleGalleryProps } from './ArticleGallery'

export { RelatedArticles } from './RelatedArticles'
export type { RelatedArticlesProps } from './RelatedArticles'

/* ---------------------------------------------------------------- DONNEES  */

export {
  useArticleViewOnce,
  useNewsArticle,
  useNewsCategories,
  useNewsList,
  useRelatedNews,
  NEWS_PAGE_SIZE,
} from './useNews'

export { fetchNewsPage, fetchRelatedNews } from './newsQueries'
export type { NewsQueryOptions, NewsSort } from './newsQueries'

/* ---------------------------------------------------- FILTRES ET LIBELLES  */

export {
  asReliability,
  asSort,
  DEFAULT_NEWS_FILTERS,
  hasActiveNewsFilters,
  readNewsFilters,
  RELIABILITY_OPTIONS,
  SORT_OPTIONS,
  writeNewsFilters,
} from './newsFilters'
export type { NewsFilters } from './newsFilters'

export { asCategoryAccent, indexCategories } from './categories'
export type { CategoryAccent, CategoryIndex } from './categories'

export { ARTICLE_STATUS_LABELS } from './status'
