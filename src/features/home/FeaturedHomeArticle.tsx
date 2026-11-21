import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { qk } from '@/lib/queryKeys'
import { listCategories, listNews } from '@/services/news'
import { HOME_STALE_TIME, TAXONOMY_STALE_TIME } from './constants'
import { FeaturedArticle } from './FeaturedArticle'

const FEATURED_FILTERS = { scope: 'home-featured', limit: 1 } as const

/**
 * Alimente la piece maitresse de l'accueil.
 *
 * Requete distincte de celle du carrousel « Actualites recentes » : elle ne
 * demande QU'UNE ligne. Les deux partent en parallele et TanStack Query les
 * met en cache separement — la mise en avant ne ralentit pas la section.
 */
export function FeaturedHomeArticle() {
  const article = useQuery({
    queryKey: qk.news(FEATURED_FILTERS),
    queryFn: () => listNews({ limit: 1 }),
    select: (page) => page.items[0] ?? null,
    staleTime: HOME_STALE_TIME,
  })

  const categories = useQuery({
    queryKey: qk.newsCategories,
    queryFn: listCategories,
    staleTime: TAXONOMY_STALE_TIME,
  })

  const label = useMemo(() => {
    const id = article.data?.category_id
    if (!id) return undefined
    return categories.data?.find((c) => c.id === id)?.label
  }, [article.data?.category_id, categories.data])

  // En cas d'echec, on ne montre rien : le carrousel de la section Actualites
  // affichera l'erreur une seule fois, au bon endroit.
  if (article.isError) return null

  return (
    <FeaturedArticle
      article={article.data}
      categoryLabel={label}
      isLoading={article.isPending}
    />
  )
}

export default FeaturedHomeArticle
