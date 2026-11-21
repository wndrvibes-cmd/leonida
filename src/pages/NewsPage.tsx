import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, EmptyState, Icon } from '@/components/ui'
import { useDebounce } from '@/hooks/useDebounce'
import { indexCategories } from '@/features/news/categories'
import {
  DEFAULT_NEWS_FILTERS,
  hasActiveNewsFilters,
  readNewsFilters,
  writeNewsFilters,
  type NewsFilters,
} from '@/features/news/newsFilters'
import { NewsFilterBar } from '@/features/news/NewsFilterBar'
import { NewsGrid } from '@/features/news/NewsGrid'
import { ReliabilityLegend } from '@/features/news/ReliabilityLegend'
import { useNewsCategories, useNewsList } from '@/features/news/useNews'
import s from '@/features/news/NewsPage.module.css'

/** Delai de frappe avant d'interroger la base. */
const SEARCH_DELAY = 350

export default function NewsPage() {
  const [params, setParams] = useSearchParams()
  const filters = readNewsFilters(params)

  /* ------------------------------------------------------------ categories */
  const categories = useNewsCategories()
  const index = useMemo(() => indexCategories(categories.data), [categories.data])

  const selectedCategory = filters.category ? index.bySlug.get(filters.category) ?? null : null
  const needsCategory = Boolean(filters.category)
  /** L'URL demande une categorie qui n'existe pas (ou plus) en base. */
  const unknownCategory = needsCategory && categories.isSuccess && !selectedCategory

  /* ------------------------------------------------------------------- fil */
  // Tant que la categorie demandee n'est pas resolue, la requete attend :
  // sinon elle renverrait le fil NON filtre, en contradiction avec l'URL.
  const listEnabled = !needsCategory || Boolean(selectedCategory)
  const list = useNewsList(filters, selectedCategory?.id ?? null, listEnabled)

  const articles = useMemo(
    () => (list.data?.pages ?? []).flatMap((page) => page.items),
    [list.data],
  )

  // On ne retient que les fonctions (stables cote react-query) : l'objet
  // complet change a chaque rendu et re-declencherait la sentinelle.
  const { fetchNextPage, refetch: refetchList } = list
  const { refetch: refetchCategories, isError: categoriesFailed } = categories

  const loadMore = useCallback(() => {
    void fetchNextPage()
  }, [fetchNextPage])

  const retry = useCallback(() => {
    if (categoriesFailed) void refetchCategories()
    void refetchList()
  }, [categoriesFailed, refetchCategories, refetchList])

  /* -------------------------------------------------------- filtres / URL - */
  // L'URL est la source de verite : un filtre reste partageable, et le bouton
  // « retour » du navigateur annule reellement le dernier filtre pose.
  const apply = useCallback(
    (next: NewsFilters) => {
      setParams(writeNewsFilters(next))
    },
    [setParams],
  )

  const reset = useCallback(() => {
    setParams(writeNewsFilters(DEFAULT_NEWS_FILTERS))
  }, [setParams])

  /* ------------------------------------------------------------ recherche - */
  const [search, setSearch] = useState(filters.q)
  const debounced = useDebounce(search, SEARCH_DELAY)

  // Derniere valeur que CET ecran a ecrite dans l'URL. Elle permet de
  // distinguer « le champ a pousse sa valeur » d'un changement venu de
  // l'exterieur (bouton retour, lien partage), seul cas ou le champ doit se
  // resynchroniser.
  const lastWritten = useRef(filters.q)
  const filtersRef = useRef(filters)
  filtersRef.current = filters

  useEffect(() => {
    const current = filtersRef.current
    if (debounced === current.q) {
      lastWritten.current = debounced
      return
    }
    lastWritten.current = debounced
    // `replace` : la frappe ne doit pas empiler une entree d'historique par
    // mot saisi.
    setParams(writeNewsFilters({ ...current, q: debounced }), { replace: true })
  }, [debounced, setParams])

  useEffect(() => {
    if (filters.q !== lastWritten.current) {
      lastWritten.current = filters.q
      setSearch(filters.q)
    }
  }, [filters.q])

  /* ----------------------------------------------------------- etats vides */
  const emptyState = unknownCategory ? (
    <EmptyState
      title="Categorie inconnue"
      description={`Aucune categorie ne correspond a « ${filters.category} ». Elle a peut-etre ete renommee.`}
      action={
        <Button variant="secondary" onClick={reset} iconLeft={<Icon name="refresh" size={18} />}>
          Voir toutes les actualites
        </Button>
      }
    />
  ) : hasActiveNewsFilters(filters) ? (
    <EmptyState
      title="Aucune actualite ne correspond"
      description="Aucun article publie ne repond a ces criteres. Elargissez la recherche ou changez de categorie."
      action={
        <Button variant="secondary" onClick={reset} iconLeft={<Icon name="refresh" size={18} />}>
          Reinitialiser les filtres
        </Button>
      }
    />
  ) : (
    <EmptyState
      illustration={<Icon name="news" size={40} />}
      title="Aucune actualite publiee pour l'instant"
      description="Rien n'a encore ete publie. Des qu'un article paraitra, il apparaitra ici avec sa source et son niveau de fiabilite — jamais avant verification."
      action={
        <Button as="link" to="/communaute" variant="secondary" iconLeft={<Icon name="community" size={18} />}>
          Voir la communaute
        </Button>
      }
    />
  )

  /* ------------------------------------------------------------- rendu --- */
  const blockedByCategories = needsCategory && categories.isError
  const loading = list.isLoading || (needsCategory && categories.isLoading)

  // Une erreur alors que des articles sont deja affiches ne peut venir que de
  // la page SUIVANTE : on garde la liste a l'ecran et on signale l'echec en
  // pied de liste, au lieu de remplacer le contenu lu par un message.
  const hasItems = articles.length > 0
  const gridError = hasItems
    ? null
    : list.error ?? (blockedByCategories ? categories.error : null)
  const nextPageError = hasItems && list.isError ? list.error : null

  return (
    <section className={`${s.page} page`}>
      <header className={s.head}>
        <p className={s.kicker}>
          <Icon name="news" size={14} />
          Actualites
        </p>
        <h1 className={s.title}>Tout ce que l'on sait de GTA VI</h1>
        <p className={s.lead}>
          Chaque article affiche sa source et son niveau de fiabilite. Une rumeur est
          annoncee comme telle : vous savez toujours ce que vous lisez.
        </p>
      </header>

      <div className={s.tools}>
        <NewsFilterBar
          filters={filters}
          search={search}
          onSearchChange={setSearch}
          onChange={apply}
          onReset={reset}
          categories={categories.data}
          categoriesLoading={categories.isLoading}
        />
        <ReliabilityLegend />
      </div>

      <div className={s.results}>
        <NewsGrid
          articles={articles}
          categoriesById={index.byId}
          isLoading={loading}
          error={gridError}
          onRetry={retry}
          hasNextPage={list.hasNextPage}
          isFetchingNextPage={list.isFetchingNextPage}
          nextPageError={nextPageError}
          onLoadMore={loadMore}
          emptyState={emptyState}
        />
      </div>
    </section>
  )
}
