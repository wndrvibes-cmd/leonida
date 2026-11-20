import { useEffect } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { qk } from '@/lib/queryKeys'
import {
  getArticleBySlug,
  incrementView,
  listCategories,
  type NewsArticleDetail,
} from '@/services/news'
import { MIN_SEARCH_LENGTH, sanitizeSearch } from '@/services/query'
import type { NewsFilters } from './newsFilters'
import { fetchNewsPage, fetchRelatedNews, type NewsQueryOptions } from './newsQueries'

/** Taille de page du fil : assez court pour un premier affichage rapide. */
export const NEWS_PAGE_SIZE = 12

/** Les categories changent tres rarement : inutile de les redemander souvent. */
const CATEGORIES_STALE_TIME = 30 * 60 * 1000

export function useNewsCategories() {
  return useQuery({
    queryKey: qk.newsCategories,
    queryFn: listCategories,
    staleTime: CATEGORIES_STALE_TIME,
  })
}

/**
 * Fil pagine par curseur.
 *
 * `enabled` sert au cas suivant : l'URL porte un slug de categorie, mais la
 * liste des categories (donc l'identifiant correspondant) n'est pas encore
 * chargee. Lancer la requete tout de suite renverrait le fil NON filtre, ce
 * qui contredirait l'URL affichee. On attend.
 */
export function useNewsList(filters: NewsFilters, categoryId: string | null, enabled = true) {
  // Un terme trop court est ignore par la base : on l'ecarte aussi de la cle
  // de cache, sinon chaque premiere lettre tapee declencherait une requete
  // dont le resultat serait le fil complet.
  const term = sanitizeSearch(filters.q)
  const q = term.length >= MIN_SEARCH_LENGTH ? term : undefined

  const request: NewsQueryOptions = {
    q,
    tag: filters.tag || undefined,
    reliability: filters.reliability || undefined,
    sort: filters.sort,
    limit: NEWS_PAGE_SIZE,
    categoryId: categoryId ?? undefined,
  }

  return useInfiniteQuery({
    queryKey: qk.news({
      q: q ?? '',
      categoryId: categoryId ?? '',
      tag: request.tag ?? '',
      reliability: request.reliability ?? '',
      sort: request.sort ?? 'recent',
    }),
    queryFn: ({ pageParam }) => fetchNewsPage({ ...request, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
  })
}

/** `data === null` est un cas NORMAL : slug inconnu, ou article non publie. */
export function useNewsArticle(slug: string | undefined) {
  return useQuery({
    queryKey: qk.newsArticle(slug ?? ''),
    queryFn: () => getArticleBySlug(slug as string),
    enabled: Boolean(slug),
  })
}

/**
 * Articles lies : meme categorie, l'article courant exclu.
 *
 * Cle locale : `qk` ne prevoit pas les articles lies, et `src/lib/queryKeys.ts`
 * appartient au socle. Ce prefixe lui reste donc etranger, comme le fait deja
 * `ReportButton` pour ses propres signalements.
 */
export function useRelatedNews(article: NewsArticleDetail | null | undefined) {
  const categoryId = article?.category_id ?? null
  const articleId = article?.id ?? null

  return useQuery({
    queryKey: ['news', 'related', categoryId ?? 'aucune', articleId ?? 'aucun'],
    queryFn: () => fetchRelatedNews(categoryId as string, articleId as string, 3),
    enabled: Boolean(categoryId && articleId),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Compte une vue, au plus une fois par session et par article.
 *
 * Deux limites assumees, toutes deux documentees cote service
 * (`incrementView`) :
 *   - la base n'accepte cette ecriture que du staff : pour un visiteur, elle
 *     est refusee silencieusement. `view_count` n'est donc JAMAIS affiche
 *     comme une audience dans cet ecran ;
 *   - si `sessionStorage` est indisponible (navigation privee verrouillee),
 *     on renonce a compter plutot que de recompter a chaque montage.
 */
export function useArticleViewOnce(articleId: string | undefined): void {
  useEffect(() => {
    if (!articleId) return

    const key = `leonida:news-vue:${articleId}`
    try {
      if (window.sessionStorage.getItem(key)) return
      window.sessionStorage.setItem(key, '1')
    } catch {
      return
    }

    void incrementView(articleId)
  }, [articleId])
}
