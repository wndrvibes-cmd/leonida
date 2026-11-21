import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { IconName } from '@/components/ui'
import { qk } from '@/lib/queryKeys'
import { listCategories, listMarkers } from '@/services/map'
import { DiscoveryCard } from '../cards/DiscoveryCard'
import {
  HOME_LIMITS, HOME_QUERY_SCOPE, HOME_STALE_TIME, TAXONOMY_STALE_TIME, markerIcon,
} from '../constants'
import { SectionBody, SectionShell } from '../SectionShell'
import { RowSkeleton, SectionRow, SectionRowItem } from '../SectionRow'
import type { SectionDensity } from '../SectionShell'

const MARKER_FILTERS = { scope: HOME_QUERY_SCOPE, limit: HOME_LIMITS.discoveries } as const

interface CategoryView {
  label: string
  icon: IconName
}

export interface DiscoveriesSectionProps {
  title: string
  density?: SectionDensity
}

/**
 * Dernieres decouvertes validees.
 *
 * Seuls les marqueurs `approved` remontent (comportement par defaut du
 * service, double par la RLS) : une contribution en attente de validation
 * n'apparaît jamais sur l'accueil.
 */
export function DiscoveriesSection({ title, density }: DiscoveriesSectionProps) {
  const markers = useQuery({
    queryKey: qk.mapMarkers(MARKER_FILTERS),
    queryFn: () => listMarkers({ limit: HOME_LIMITS.discoveries }),
    staleTime: HOME_STALE_TIME,
  })

  const categories = useQuery({
    queryKey: qk.mapCategories,
    queryFn: () => listCategories(),
    staleTime: TAXONOMY_STALE_TIME,
  })

  const views = useMemo(() => {
    const map = new Map<string, CategoryView>()
    for (const category of categories.data ?? []) {
      map.set(category.id, { label: category.label, icon: markerIcon(category.icon) })
    }
    return map
  }, [categories.data])

  return (
    <SectionShell
      density={density}
      icon="compass"
      title={title}
      subtitle="Les trouvailles de la communauté, validées par l'équipe."
      to="/carte"
      linkLabel="Ouvrir la carte"
    >
      <SectionBody
        isLoading={markers.isPending}
        isError={markers.isError}
        error={markers.error}
        onRetry={() => void markers.refetch()}
        isEmpty={(markers.data?.length ?? 0) === 0}
        empty={{
          title: 'Aucune découverte validée pour le moment',
          description:
            'Les contributions des membres passent par une file de validation avant d\'apparaître ici.',
          icon: 'compass',
          adminTo: '/admin/carte',
          adminLabel: 'Ouvrir la file de validation',
        }}
        skeleton={<RowSkeleton count={4} size="sm" />}
      >
        <SectionRow size="sm" ariaLabel={title}>
          {(markers.data ?? []).map((marker) => {
            const view = marker.category_id ? views.get(marker.category_id) : undefined
            return (
              <SectionRowItem key={marker.id}>
                <DiscoveryCard
                  marker={marker}
                  categoryLabel={view?.label}
                  categoryIcon={view?.icon}
                />
              </SectionRowItem>
            )
          })}
        </SectionRow>
      </SectionBody>
    </SectionShell>
  )
}
