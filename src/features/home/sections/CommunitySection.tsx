import { useQuery } from '@tanstack/react-query'
import { qk } from '@/lib/queryKeys'
import { listPosts } from '@/services/posts'
import { PostCard } from '../cards/PostCard'
import { HOME_LIMITS, HOME_QUERY_SCOPE, HOME_STALE_TIME } from '../constants'
import { SectionBody, SectionShell } from '../SectionShell'
import { RowSkeleton, SectionRow, SectionRowItem } from '../SectionRow'
import type { SectionDensity } from '../SectionShell'

const COMMUNITY_FILTERS = {
  scope: HOME_QUERY_SCOPE, surface: 'community', limit: HOME_LIMITS.community,
} as const

export interface CommunitySectionProps {
  title: string
  density?: SectionDensity
}

export function CommunitySection({ title, density }: CommunitySectionProps) {
  const posts = useQuery({
    queryKey: qk.posts(COMMUNITY_FILTERS),
    queryFn: () => listPosts({ surface: 'community', limit: HOME_LIMITS.community }),
    select: (page) => page.items,
    staleTime: HOME_STALE_TIME,
  })

  return (
    <SectionShell
      density={density}
      icon="community"
      title={title}
      subtitle="Les dernières discussions, astuces et questions des membres."
      to="/communaute"
    >
      <SectionBody
        isLoading={posts.isPending}
        isError={posts.isError}
        error={posts.error}
        onRetry={() => void posts.refetch()}
        isEmpty={(posts.data?.length ?? 0) === 0}
        empty={{
          title: 'Aucune publication pour le moment',
          description:
            'Les discussions des membres apparaîtront ici dès la première publication.',
          icon: 'community',
          adminTo: '/admin/communaute',
          adminLabel: 'Modérer la communauté',
        }}
        skeleton={<RowSkeleton count={3} withCover={false} />}
      >
        <SectionRow ariaLabel={title}>
          {(posts.data ?? []).map((post) => (
            <SectionRowItem key={post.id}>
              <PostCard post={post} />
            </SectionRowItem>
          ))}
        </SectionRow>
      </SectionBody>
    </SectionShell>
  )
}
