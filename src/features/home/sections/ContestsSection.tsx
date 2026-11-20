import { useQuery } from '@tanstack/react-query'
import { qk } from '@/lib/queryKeys'
import { listContests } from '@/services/contests'
import { ContestCard } from '../cards/ContestCard'
import { HOME_LIMITS, HOME_QUERY_SCOPE, HOME_STALE_TIME } from '../constants'
import { SectionBody, SectionShell } from '../SectionShell'
import { RowSkeleton, SectionRow, SectionRowItem } from '../SectionRow'

const CONTEST_FILTERS = {
  scope: HOME_QUERY_SCOPE, active: true, limit: HOME_LIMITS.contests,
} as const

export interface ContestsSectionProps {
  title: string
}

/** Operations OUVERTES uniquement : annoncer un concours clos serait trompeur. */
export function ContestsSection({ title }: ContestsSectionProps) {
  const contests = useQuery({
    queryKey: qk.contests(CONTEST_FILTERS),
    queryFn: () => listContests({ active: true, limit: HOME_LIMITS.contests }),
    staleTime: HOME_STALE_TIME,
  })

  return (
    <SectionShell
      icon="gift"
      title={title}
      subtitle="Les operations ouvertes, avec leurs conditions et leurs dates."
      to="/cadeaux"
    >
      <SectionBody
        isLoading={contests.isPending}
        isError={contests.isError}
        error={contests.error}
        onRetry={() => void contests.refetch()}
        isEmpty={(contests.data?.length ?? 0) === 0}
        empty={{
          title: 'Aucune operation en cours',
          description:
            'Concours, cadeaux et offres apparaitront ici pendant leur periode de validite.',
          icon: 'gift',
          adminTo: '/admin/cadeaux',
          adminLabel: 'Creer une operation',
        }}
        skeleton={<RowSkeleton count={3} />}
      >
        <SectionRow ariaLabel={title}>
          {(contests.data ?? []).map((contest) => (
            <SectionRowItem key={contest.id}>
              <ContestCard contest={contest} />
            </SectionRowItem>
          ))}
        </SectionRow>
      </SectionBody>
    </SectionShell>
  )
}
