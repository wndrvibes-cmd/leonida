import { useQuery } from '@tanstack/react-query'
import { qk } from '@/lib/queryKeys'
import { listPosts } from '@/services/posts'
import { MomentCard } from '../cards/MomentCard'
import { HOME_LIMITS, HOME_QUERY_SCOPE, HOME_STALE_TIME } from '../constants'
import { SectionBody, SectionShell } from '../SectionShell'
import { RowSkeleton, SectionRow, SectionRowItem } from '../SectionRow'
import type { SectionDensity } from '../SectionShell'

const MOMENTS_FILTERS = {
  scope: HOME_QUERY_SCOPE, surface: 'moment', sort: 'popular', limit: HOME_LIMITS.moments,
} as const

export interface MomentsSectionProps {
  title: string
  density?: SectionDensity
}

/**
 * Moments les plus reagis. Le tri `popular` s'appuie sur `reaction_count`,
 * une colonne maintenue par la base : le classement n'est pas simule.
 */
export function MomentsSection({ title, density }: MomentsSectionProps) {
  const moments = useQuery({
    queryKey: qk.posts(MOMENTS_FILTERS),
    queryFn: () =>
      listPosts({ surface: 'moment', sort: 'popular', limit: HOME_LIMITS.moments }),
    select: (page) => page.items,
    staleTime: HOME_STALE_TIME,
  })

  return (
    <SectionShell
      density={density}
      icon="moments"
      title={title}
      subtitle="Les captures et séquences qui ont le plus fait réagir."
      to="/moments"
    >
      <SectionBody
        isLoading={moments.isPending}
        isError={moments.isError}
        error={moments.error}
        onRetry={() => void moments.refetch()}
        isEmpty={(moments.data?.length ?? 0) === 0}
        empty={{
          title: 'Aucun moment partagé pour le moment',
          description:
            'Les captures et vidéos partagées par les membres s\'afficheront ici.',
          icon: 'moments',
          adminTo: '/admin/communaute',
          adminLabel: 'Modérer les moments',
        }}
        skeleton={<RowSkeleton count={4} size="sm" square />}
      >
        <SectionRow size="sm" ariaLabel={title}>
          {(moments.data ?? []).map((moment) => (
            <SectionRowItem key={moment.id}>
              <MomentCard moment={moment} />
            </SectionRowItem>
          ))}
        </SectionRow>
      </SectionBody>
    </SectionShell>
  )
}
