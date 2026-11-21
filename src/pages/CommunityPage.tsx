import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Icon, Tabs, type TabItem } from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import {
  COMMUNITY_TABS, CommunityToolbar, DEFAULT_COMMUNITY_FILTERS, DeletePostDialog, EmptyFeed,
  PostComposer, PostEditor, PostFeed, TAB_HINTS, TAB_LABELS, asCommunityTab, collectTags,
  hasActiveCommunityFilters, readCommunityFilters, useCommunityFeed, writeCommunityFilters,
  type CommunityFilters, type CommunityTab,
} from '@/features/community'
import { useDebounce } from '@/hooks/useDebounce'
import { MIN_SEARCH_LENGTH, sanitizeSearch } from '@/services/query'
import type { PostListItem } from '@/services/posts'
import s from '@/features/community/CommunityPage.module.css'

/** Delai de frappe avant d'interroger la base. */
const SEARCH_DELAY = 350

const TAB_ICONS: Record<CommunityTab, 'clock' | 'fire' | 'compass'> = {
  recentes: 'clock',
  populaires: 'fire',
  decouvertes: 'compass',
}

export default function CommunityPage() {
  const [params, setParams] = useSearchParams()
  const filters = readCommunityFilters(params)
  const { isSuspended } = useAuth()

  /* ------------------------------------------------------------------- fil */
  const feed = useCommunityFeed(filters)
  const posts = useMemo(
    () => (feed.data?.pages ?? []).flatMap((page) => page.items),
    [feed.data],
  )
  const tags = useMemo(() => collectTags(posts), [posts])

  // Seules les fonctions (stables cote react-query) sont retenues : l'objet
  // complet change a chaque rendu et re-declencherait la sentinelle.
  const { fetchNextPage, refetch } = feed

  const loadMore = useCallback(() => {
    void fetchNextPage()
  }, [fetchNextPage])

  const retry = useCallback(() => {
    void refetch()
  }, [refetch])

  /* -------------------------------------------------------- filtres / URL - */
  // L'URL est la source de verite : un fil filtre reste partageable, et le
  // bouton « retour » annule reellement le dernier filtre pose.
  const apply = useCallback(
    (next: CommunityFilters) => {
      setParams(writeCommunityFilters(next))
    },
    [setParams],
  )

  const reset = useCallback(() => {
    setParams(writeCommunityFilters(DEFAULT_COMMUNITY_FILTERS))
  }, [setParams])

  const selectTab = useCallback(
    (value: string) => {
      const tab = asCommunityTab(value)
      // L'onglet Découvertes impose son type : garder l'ancien en memoire
      // afficherait un filtre sans effet.
      apply({ ...filters, tab, type: tab === 'decouvertes' ? '' : filters.type })
    },
    [apply, filters],
  )

  /* ------------------------------------------------------------ recherche - */
  const [search, setSearch] = useState(filters.q)
  const debounced = useDebounce(search, SEARCH_DELAY)

  // Derniere valeur que CET ecran a ecrite dans l'URL : elle distingue « le
  // champ a pousse sa valeur » d'un changement venu de l'exterieur (bouton
  // retour, lien partage), seul cas ou le champ doit se resynchroniser.
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
    // `replace` : la frappe ne doit pas empiler une entree d'historique par mot.
    setParams(writeCommunityFilters({ ...current, q: debounced }), { replace: true })
  }, [debounced, setParams])

  useEffect(() => {
    if (filters.q !== lastWritten.current) {
      lastWritten.current = filters.q
      setSearch(filters.q)
    }
  }, [filters.q])

  /* ----------------------------------------------------------- composition */
  const [composerOpen, setComposerOpen] = useState(false)
  const [editing, setEditing] = useState<PostListItem | null>(null)
  const [deleting, setDeleting] = useState<PostListItem | null>(null)

  const composeDisabledReason = isSuspended
    ? 'Votre compte est suspendu : vous ne pouvez pas publier pour le moment.'
    : null

  const openComposer = useCallback(() => setComposerOpen(true), [])

  const tabItems: TabItem[] = COMMUNITY_TABS.map((tab) => ({
    value: tab,
    label: TAB_LABELS[tab],
    icon: <Icon name={TAB_ICONS[tab]} size={16} />,
  }))

  /* ----------------------------------------------------------- etats vides */
  const searching = sanitizeSearch(filters.q).length >= MIN_SEARCH_LENGTH
  const emptyState = (
    <EmptyFeed
      variant={searching ? 'search' : hasActiveCommunityFilters(filters) ? 'filtered' : 'start'}
      query={filters.q}
      onReset={reset}
      onCompose={composeDisabledReason ? undefined : openComposer}
      composeDisabledReason={composeDisabledReason}
    />
  )

  /* -------------------------------------------------------------- rendu -- */
  // Une erreur alors que des publications sont deja affichees ne peut venir
  // que de la page SUIVANTE : on garde le fil a l'écran et on signale l'echec
  // en pied de liste, au lieu de remplacer ce qui est en cours de lecture.
  const hasItems = posts.length > 0
  const feedError = hasItems ? null : feed.error
  const nextPageError = hasItems && feed.isError ? feed.error : null

  return (
    <section className={`${s.page} page`}>
      <header className={s.head}>
        <p className={s.kicker}>
          <Icon name="community" size={14} />
          Communauté
        </p>
        <h1 className={s.title}>Ce que les joueurs trouvent, testent et racontent</h1>
        <p className={s.lead}>
          Astuces, découvertes, captures et questions, publiées par les membres sous leur
          propre nom. Rien n'est écrit par l'équipe LEONIDA a leur place.
        </p>
      </header>

      <div className={s.tools}>
        <div className={s.tabsRow}>
          <Tabs
            items={tabItems}
            value={filters.tab}
            onChange={selectTab}
            ariaLabel="Trier le fil"
          />
          <p className={s.tabHint}>{TAB_HINTS[filters.tab]}</p>
        </div>

        <CommunityToolbar
          filters={filters}
          search={search}
          onSearchChange={setSearch}
          onChange={apply}
          onReset={reset}
          tags={tags}
          action={
            <Button
              variant="primary"
              size="md"
              onClick={openComposer}
              disabled={Boolean(composeDisabledReason)}
              iconLeft={<Icon name="plus" size={18} />}
            >
              Publier
            </Button>
          }
        />

        {composeDisabledReason ? (
          <p className={s.suspended} role="note">
            <Icon name="lock" size={16} />
            {composeDisabledReason}
          </p>
        ) : null}
      </div>

      <div className={s.results}>
        <PostFeed
          posts={posts}
          isLoading={feed.isLoading}
          error={feedError}
          onRetry={retry}
          hasNextPage={feed.hasNextPage}
          isFetchingNextPage={feed.isFetchingNextPage}
          nextPageError={nextPageError}
          onLoadMore={loadMore}
          emptyState={emptyState}
          onTagSelect={(tag) => apply({ ...filters, tag })}
          onEdit={setEditing}
          onDelete={setDeleting}
        />
      </div>

      <PostComposer open={composerOpen} onClose={() => setComposerOpen(false)} />

      {editing ? <PostEditor post={editing} onClose={() => setEditing(null)} /> : null}

      {deleting ? (
        <DeletePostDialog
          post={deleting}
          onCancel={() => setDeleting(null)}
          onDeleted={() => setDeleting(null)}
        />
      ) : null}
    </section>
  )
}
