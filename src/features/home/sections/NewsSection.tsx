import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { qk } from '@/lib/queryKeys'
import { listCategories, listNews } from '@/services/news'
import { NewsCard } from '../cards/NewsCard'
import { HOME_LIMITS, HOME_QUERY_SCOPE, HOME_STALE_TIME, TAXONOMY_STALE_TIME } from '../constants'
import { SectionBody, SectionShell } from '../SectionShell'
import { RowSkeleton, SectionRow, SectionRowItem } from '../SectionRow'
import type { SectionDensity } from '../SectionShell'

const NEWS_FILTERS = { scope: HOME_QUERY_SCOPE, limit: HOME_LIMITS.news } as const

export interface NewsSectionProps {
  title: string
  density?: SectionDensity
}

export function NewsSection({ title, density }: NewsSectionProps) {
  const articles = useQuery({
    queryKey: qk.news(NEWS_FILTERS),
    queryFn: () => listNews({ limit: HOME_LIMITS.news }),
    select: (page) => page.items,
    staleTime: HOME_STALE_TIME,
  })

  // Taxonomie : une requete minuscule, partagee avec la page Actualites.
  // Son echec n'est pas remonte — il prive la carte de son libelle de
  // categorie, pas de son contenu.
  const categories = useQuery({
    queryKey: qk.newsCategories,
    queryFn: listCategories,
    staleTime: TAXONOMY_STALE_TIME,
  })

  const labels = useMemo(() => {
    const map = new Map<string, string>()
    for (const category of categories.data ?? []) map.set(category.id, category.label)
    return map
  }, [categories.data])

  return (
    <SectionShell
      density={density}
      icon="news"
      title={title}
      subtitle="Ce que l'on sait de Leonida, source par source."
      to="/actualites"
    >
      <SectionBody
        isLoading={articles.isPending}
        isError={articles.isError}
        error={articles.error}
        onRetry={() => void articles.refetch()}
        isEmpty={(articles.data?.length ?? 0) === 0}
        empty={{
          title: 'Aucune actualité publiée pour le moment',
          description:
            'Les articles publiés par l\'équipe apparaîtront ici, avec leur niveau de fiabilité.',
          icon: 'news',
          adminTo: '/admin/actualites',
          adminLabel: 'Publier une actualité',
        }}
        skeleton={<RowSkeleton count={3} />}
      >
        <SectionRow ariaLabel={title}>
          {(articles.data ?? []).map((article) => (
            <SectionRowItem key={article.id}>
              <NewsCard
                article={article}
                categoryLabel={
                  article.category_id ? labels.get(article.category_id) : undefined
                }
              />
            </SectionRowItem>
          ))}
        </SectionRow>
      </SectionBody>
    </SectionShell>
  )
}
