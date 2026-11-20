import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, Badge, Icon, cx } from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import { formatDate, relativeTime } from '@/lib/format'
import type { AuthorSummary } from '@/services/authors'
import s from './AuthorLine.module.css'

export interface AuthorLineProps {
  /** `null` est un cas NORMAL : compte supprime ou profil illisible. */
  author: AuthorSummary | null
  /** Date ISO du contenu. Affichee en relatif, date complete au survol. */
  date?: string | null
  size?: 'sm' | 'md'
  /**
   * Statut premium de l'auteur, uniquement s'il est REELLEMENT connu.
   *
   * Laisse de cote, le badge n'apparait que pour le membre connecte lui-meme :
   * la migration 0009 interdit volontairement de sonder l'abonnement d'un
   * autre membre, et `profiles` n'expose aucun indicateur premium. Afficher le
   * badge « au cas ou » reviendrait a inventer une information.
   */
  isPremium?: boolean
  /** Contenu aligne a droite : actions, horodatage secondaire, badge... */
  trailing?: ReactNode
  className?: string
}

export function AuthorLine({
  author,
  date,
  size = 'md',
  isPremium,
  trailing,
  className,
}: AuthorLineProps) {
  const { user, isPremium: viewerIsPremium } = useAuth()

  const isSelf = Boolean(author && user && author.id === user.id)
  const premium = isPremium ?? (isSelf ? viewerIsPremium : false)

  const name = author?.display_name?.trim() || author?.username || null
  const avatarSize = size === 'sm' ? 'sm' : 'md'

  return (
    <div className={cx(s.row, size === 'sm' && s.sm, className)}>
      <Avatar src={author?.avatar_url ?? null} name={name} size={avatarSize} isPremium={premium} />

      <div className={s.identity}>
        <span className={s.nameRow}>
          {author?.username ? (
            <Link to={`/profil/${author.username}`} className={s.name}>
              {name}
            </Link>
          ) : (
            <span className={cx(s.name, s.nameMuted)}>
              {name ?? 'Membre supprime'}
            </span>
          )}

          {premium ? (
            <Badge tone="premium" size="sm" icon={<Icon name="crown" size={12} />}>
              LEONIDA+
            </Badge>
          ) : null}

          {author?.is_suspended ? (
            <Badge tone="neutral" size="sm" title="Ce compte est suspendu.">
              Suspendu
            </Badge>
          ) : null}
        </span>

        {date ? (
          <time className={s.date} dateTime={date} title={formatDate(date, true)}>
            {relativeTime(date)}
          </time>
        ) : null}
      </div>

      {trailing ? <div className={s.trailing}>{trailing}</div> : null}
    </div>
  )
}
