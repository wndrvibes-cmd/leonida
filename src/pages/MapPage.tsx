import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Button, EmptyState, ErrorState, Icon, Modal, Skeleton, Tabs,
  useBodyScrollLock, useEscapeKey, useIsMobile,
} from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import {
  ContributeButton, ContributeDialog, PlacementBanner,
  MapToolbar, MapViewport, MarkerDetail, MarkerLayer, MyContributions,
  clusterMarkers, useContributeFlow, useMapCategories, useMapConfig, useMapMarkers,
  type MapView, type MapViewportHandle, type MarkerWithCategory, type RelativePoint,
} from '@/features/map'
import s from '@/features/map/MapPage.module.css'

/**
 * LA CARTE DE LEONIDA.
 *
 * Tant que `map.config.image_url` est vide — c'est le cas aujourd'hui —
 * l'écran affiche un état vide explicite. AUCUNE carte de substitution n'est
 * dessinee : inventer une geographie de Leonida serait une fausse
 * information, et l'utilisateur la prendrait pour la vraie.
 *
 * La page orchestre ; le moteur de vue, les marqueurs, la fiche et la
 * contribution vivent dans `src/features/map/`.
 */

type TabValue = 'carte' | 'contributions'

export default function MapPage() {
  const { user, isStaff } = useAuth()
  const isMobile = useIsMobile()
  const [params, setParams] = useSearchParams()

  const config = useMapConfig()
  const categories = useMapCategories()
  const markers = useMapMarkers()

  const [tab, setTab] = useState<TabValue>('carte')
  const [query, setQuery] = useState('')
  const [activeCategories, setActiveCategories] = useState<string[]>([])
  const [view, setView] = useState<MapView>({ scale: 1, displayedWidth: 0, displayedHeight: 0 })
  const [immersive, setImmersive] = useState(false)

  const viewportRef = useRef<MapViewportHandle>(null)
  const flow = useContributeFlow()

  /** Selection portee par l'URL : une fiche se partage par lien. */
  const selectedId = params.get('decouverte')

  const select = useCallback((id: string | null) => {
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      if (id) next.set('decouverte', id)
      else next.delete('decouverte')
      return next
    }, { replace: true })
  }, [setParams])

  useBodyScrollLock(immersive)
  useEscapeKey(immersive, () => setImmersive(false))

  /* ------------------------------------------------------------- donnees -- */

  const categoryList = categories.data ?? []

  const entries = useMemo<MarkerWithCategory[]>(() => {
    const byId = new Map(categoryList.map((category) => [category.id, category]))
    return (markers.data ?? []).map((marker) => ({
      marker,
      category: marker.category_id ? byId.get(marker.category_id) ?? null : null,
    }))
  }, [markers.data, categoryList])

  /** Recherche appliquee seule : sert aussi aux compteurs des puces. */
  const searched = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return entries
    return entries.filter(({ marker }) =>
      marker.title.toLowerCase().includes(term)
      || (marker.description ?? '').toLowerCase().includes(term))
  }, [entries, query])

  const visible = useMemo(() => {
    if (activeCategories.length === 0) return searched
    return searched.filter(({ marker }) =>
      marker.category_id !== null && activeCategories.includes(marker.category_id))
  }, [searched, activeCategories])

  const countsByCategory = useMemo(() => {
    const counts = new Map<string, number>()
    for (const { marker } of searched) {
      if (!marker.category_id) continue
      counts.set(marker.category_id, (counts.get(marker.category_id) ?? 0) + 1)
    }
    return counts
  }, [searched])

  const items = useMemo(
    () => clusterMarkers(visible, view.displayedWidth, view.displayedHeight),
    [visible, view.displayedWidth, view.displayedHeight],
  )

  const selectedCategory = useMemo(() => {
    if (!selectedId) return null
    return entries.find(({ marker }) => marker.id === selectedId)?.category ?? null
  }, [entries, selectedId])

  /* ------------------------------------------------------------- actions -- */

  const toggleCategory = useCallback((id: string) => {
    setActiveCategories((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id])
  }, [])

  const screenToImage = useCallback(
    (px: number, py: number): RelativePoint =>
      viewportRef.current?.screenToImage(px, py) ?? { x: 0, y: 0 },
    [],
  )

  /**
   * Recadrage differe. En venant de l'onglet « Mes contributions », le moteur
   * de vue n'est pas encore monte ni mesure : on memorise la cible et on la
   * joue des que la vue publie ses dimensions (`displayedWidth > 0`).
   */
  const pendingFocusRef = useRef<RelativePoint | null>(null)

  const locate = useCallback((x: number, y: number, id: string) => {
    pendingFocusRef.current = { x, y }
    setTab('carte')
    select(id)
  }, [select])

  useEffect(() => {
    const target = pendingFocusRef.current
    if (!target || view.displayedWidth === 0) return
    pendingFocusRef.current = null
    viewportRef.current?.centerOn(target.x, target.y, 3)
  }, [view.displayedWidth])

  /* -------------------------------------------------------------- etats --- */

  if (config.isPending) {
    return (
      <div className={`page ${s.page}`}>
        <Skeleton height={40} width="55%" />
        <Skeleton height={56} radius="lg" />
        <Skeleton height={420} radius="lg" />
      </div>
    )
  }

  if (config.isError) {
    return (
      <div className={`page ${s.page}`}>
        <ErrorState
          error={config.error}
          title="Carte indisponible"
          onRetry={() => { void config.refetch() }}
        />
      </div>
    )
  }

  const mapConfig = config.data

  /* Pas d'image : etat vide explicite, et surtout aucun fond invente. */
  if (!mapConfig.imageUrl) {
    return (
      <div className={`page ${s.page}`}>
        <MapHeader disclaimer={null} />
        <EmptyState
          title="La carte n'est pas encore en ligne"
          description={
            isStaff
              ? "Aucune image n'a encore été téléversée. Rendez-vous dans l'administration pour envoyer le fond de carte et renseigner ses dimensions : les marqueurs et les contributions s'activeront aussitot."
              : "L'équipe LEONIDA n'a pas encore publié le fond de carte. Les lieux, secrets et découvertes proposes par les membres apparaîtront ici des qu'elle sera en ligne."
          }
          illustration={<Icon name="map" size={40} />}
          action={
            isStaff
              ? <Button as="link" to="/admin/carte" variant="primary" size="lg">
                  Téléverser la carte
                </Button>
              : undefined
          }
        />
      </div>
    )
  }

  const tabs = [
    { value: 'carte', label: 'Carte', icon: <Icon name="map" size={18} /> },
    ...(user
      ? [{ value: 'contributions', label: 'Mes contributions', icon: <Icon name="pin" size={18} /> }]
      : []),
  ]

  const contributeButton = <ContributeButton flow={flow} />

  const detail = selectedId
    ? <MarkerDetail markerId={selectedId} category={selectedCategory} />
    : null

  return (
    <div className={`page ${s.page}`}>
      <MapHeader disclaimer={mapConfig.disclaimer} />

      {user ? (
        <Tabs
          items={tabs}
          value={tab}
          onChange={(value) => setTab(value as TabValue)}
          ariaLabel="Sections de la carte"
        />
      ) : null}

      {tab === 'contributions' ? (
        <MyContributions
          userId={user?.id ?? null}
          categories={categoryList}
          onEdit={flow.startEdit}
          onLocate={(marker) => locate(marker.x, marker.y, marker.id)}
          action={contributeButton}
        />
      ) : (
        <>
          <MapToolbar
            categories={categoryList}
            selectedCategories={activeCategories}
            onToggleCategory={toggleCategory}
            onClearCategories={() => setActiveCategories([])}
            query={query}
            onQueryChange={setQuery}
            resultCount={visible.length}
            totalCount={entries.length}
            countsByCategory={countsByCategory}
            immersive={immersive}
            onToggleImmersive={() => setImmersive((value) => !value)}
            contributeSlot={contributeButton}
          />

          {markers.isError ? (
            <ErrorState
              error={markers.error}
              title="Découvertes non chargées"
              description="La carte s'affiche, mais ses marqueurs n'ont pas pu être recuperes."
              onRetry={() => { void markers.refetch() }}
              compact
            />
          ) : null}

          <div className={`${s.stage} ${immersive ? s.immersive : ''}`}>
            <div className={s.mapColumn}>
              <MapViewport
                ref={viewportRef}
                imageUrl={mapConfig.imageUrl}
                naturalWidth={mapConfig.naturalWidth}
                naturalHeight={mapConfig.naturalHeight}
                minZoom={mapConfig.minZoom}
                maxZoom={mapConfig.maxZoom}
                alt="Carte de Leonida"
                placing={flow.step === 'placing'}
                onViewChange={setView}
                onMapTap={flow.step === 'placing' ? flow.place : undefined}
                overlay={
                  <>
                    <PlacementBanner flow={flow} />
                    {markers.isPending ? (
                      <p className={s.mapNote}>Chargement des découvertes…</p>
                    ) : null}
                    {!markers.isPending && !markers.isError && entries.length === 0 ? (
                      <p className={s.mapNote}>
                        Aucune découverte validée pour l'instant. La carte se remplira
                        avec les propositions de la communauté.
                      </p>
                    ) : null}
                    {!markers.isPending && entries.length > 0 && visible.length === 0 ? (
                      <p className={s.mapNote}>
                        Aucune découverte ne correspond a cette recherche.
                      </p>
                    ) : null}
                    {mapConfig.disclaimer ? (
                      <p className={s.disclaimer}>{mapConfig.disclaimer}</p>
                    ) : null}
                  </>
                }
              >
                <MarkerLayer
                  items={items}
                  selectedId={selectedId}
                  onSelect={(entry) => select(entry.marker.id)}
                  onCluster={(point) =>
                    viewportRef.current?.centerOn(point.x, point.y, view.scale * 2)}
                  preview={flow.step === 'placing' ? flow.point : null}
                  onPreviewMove={flow.place}
                  screenToImage={screenToImage}
                />
              </MapViewport>
            </div>

            {/* Fiche : panneau lateral sur grand ecran, feuille montante sur
                telephone. Le mode immersif garde le panneau accessible. */}
            {!isMobile && selectedId ? (
              <aside className={s.panel} aria-label="Fiche de la decouverte">
                <div className={s.panelBar}>
                  <Button
                    variant="ghost" size="sm" iconOnly
                    aria-label="Fermer la fiche"
                    onClick={() => select(null)}
                  >
                    <Icon name="close" size={20} />
                  </Button>
                </div>
                <div className={s.panelBody}>{detail}</div>
              </aside>
            ) : null}
          </div>
        </>
      )}

      {/* L'onglet « Mes contributions » ne doit pas se faire recouvrir par une
          fiche restee dans l'URL. */}
      {isMobile ? (
        <Modal
          open={selectedId !== null && tab === 'carte'}
          onClose={() => select(null)}
          ariaLabel="Fiche de la découverte"
          size="md"
        >
          {detail}
        </Modal>
      ) : null}

      <ContributeDialog flow={flow} categories={categoryList} userId={user?.id ?? null} />
    </div>
  )
}

function MapHeader({ disclaimer }: { disclaimer: string | null }) {
  return (
    <header className={s.head}>
      <h1 className={s.title}>Carte de Leonida</h1>
      <p className={s.subtitle}>
        Lieux, véhicules, secrets et découvertes proposes par la communauté.
        Chaque repère affiche son niveau de vérification.
      </p>
      {disclaimer ? <p className={s.headDisclaimer}>{disclaimer}</p> : null}
    </header>
  )
}
