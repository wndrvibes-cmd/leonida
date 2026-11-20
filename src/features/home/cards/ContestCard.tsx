import { Badge, Card, Icon } from '@/components/ui'
import { CONTEST_CATEGORY_LABELS } from '@/lib/constants'
import { formatDate, truncate } from '@/lib/format'
import { isContestOpen, type Contest } from '@/services/contests'
import { CoverArt } from '../CoverArt'
import s from './ContestCard.module.css'

export interface ContestCardProps {
  contest: Contest
}

/** Phrase de calendrier construite a partir des dates reelles, jamais d'un
    compte a rebours approximatif. */
function scheduleLabel(contest: Contest, open: boolean): string | null {
  const now = Date.now()

  if (contest.starts_at && new Date(contest.starts_at).getTime() > now) {
    return `Ouvre le ${formatDate(contest.starts_at)}`
  }
  if (contest.ends_at) {
    return open
      ? `Jusqu'au ${formatDate(contest.ends_at)}`
      : `Termine le ${formatDate(contest.ends_at)}`
  }
  return null
}

export function ContestCard({ contest }: ContestCardProps) {
  const open = isContestOpen(contest)
  const category = CONTEST_CATEGORY_LABELS[contest.category] ?? contest.category
  const schedule = scheduleLabel(contest, open)

  return (
    <Card to={`/cadeaux/${contest.slug}`} padding="none" className={s.card}>
      <CoverArt
        src={contest.image_url}
        seed={contest.id}
        icon="gift"
        ratio="wide"
        className={s.cover}
      />

      <div className={s.body}>
        <div className={s.meta}>
          <Badge tone={open ? 'success' : 'neutral'} size="sm" dot>
            {open ? 'En cours' : 'Termine'}
          </Badge>
          <span className={s.category}>{category}</span>
        </div>

        <h3 className={s.title}>{contest.title}</h3>

        {contest.description ? (
          <p className={s.description}>{truncate(contest.description, 110)}</p>
        ) : null}

        {schedule ? (
          <p className={s.schedule}>
            <Icon name="calendar" size={14} />
            <span>{schedule}</span>
          </p>
        ) : null}
      </div>
    </Card>
  )
}
