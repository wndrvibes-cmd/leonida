import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Avatar, Button, ConfirmDialog, EmptyState, ErrorState, Icon, Skeleton, useToast,
  type IconName,
} from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import {
  useDeleteNotification, useDeleteReadNotifications, useMarkAllNotificationsRead,
  useMarkNotificationRead, useNotifications, useUnreadCount,
} from '@/hooks/useNotifications'
import { formatDate, relativeTime } from '@/lib/format'
import { publicUrl, readableError } from '@/lib/supabase'
import type { NotificationItem } from '@/services/notifications'
import type { Database } from '@/types/database'
import { notificationLink, useNotificationSlugs, type SlugIndex } from './notificationLinks'
import s from './NotificationsScreen.module.css'

type NotificationType = Database['public']['Enums']['notification_type']

const TYPE_ICONS: Record<NotificationType, IconName> = {
  comment_reply: 'comment',
  post_comment: 'comment',
  reaction: 'fire',
  marker_approved: 'check',
  marker_rejected: 'alert',
  report_resolved: 'shield',
  subscription: 'crown',
  contest: 'gift',
  news: 'news',
  system: 'info',
}

/** Libelle du jour : « Aujourd'hui », « Hier », puis la date complete. */
function dayLabel(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Date inconnue'

  const start = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate())
  const days = Math.round((start(new Date()).getTime() - start(date).getTime()) / 86_400_000)

  if (days <= 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  return formatDate(iso)
}

interface DayGroup {
  key: string
  label: string
  items: NotificationItem[]
}

/** Regroupe par jour en conservant l'ordre decroissant deja renvoye par la base. */
function groupByDay(items: NotificationItem[]): DayGroup[] {
  const groups: DayGroup[] = []
  for (const item of items) {
    const key = item.created_at.slice(0, 10)
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.items.push(item)
    else groups.push({ key, label: dayLabel(item.created_at), items: [item] })
  }
  return groups
}

/* -------------------------------------------------------------------------- */

interface RowProps {
  item: NotificationItem
  slugs: SlugIndex
  onRead: (id: string) => void
  onDelete: (item: NotificationItem) => void
  busy: boolean
}

function NotificationRow({ item, slugs, onRead, onDelete, busy }: RowProps) {
  const href = notificationLink(item, slugs)
  const actorName = item.actor?.display_name?.trim() || item.actor?.username || null
  const avatarUrl = publicUrl('avatars', item.actor?.avatar_url)

  return (
    <li className={item.is_read ? s.row : `${s.row} ${s.rowUnread}`}>
      <span className={s.rowMark} aria-hidden="true">
        {item.is_read ? null : <span className={s.dot} />}
      </span>

      <span className={s.rowIcon}>
        {item.actor ? (
          <Avatar src={avatarUrl} name={actorName} size="sm" />
        ) : (
          <span className={s.typeIcon} aria-hidden="true">
            <Icon name={TYPE_ICONS[item.type]} size={18} />
          </span>
        )}
      </span>

      <div className={s.rowBody}>
        <p className={s.rowTitle}>
          {item.is_read ? null : <span className="sr-only">Non lue — </span>}
          {item.title}
        </p>

        {item.body?.trim() ? <p className={s.rowText}>{item.body}</p> : null}

        <p className={s.rowMeta}>
          {actorName ? <span className={s.actor}>{actorName}</span> : null}
          <time dateTime={item.created_at} title={formatDate(item.created_at, true)}>
            {relativeTime(item.created_at)}
          </time>
        </p>

        <div className={s.rowActions}>
          {href ? (
            <Link
              to={href}
              className={s.open}
              onClick={() => {
                if (!item.is_read) onRead(item.id)
              }}
            >
              <Icon name="arrow-right" size={15} />
              Voir l'élément concerne
            </Link>
          ) : (
            <span className={s.noLink}>
              Aucun élément a ouvrir : cette notification ne désigné pas de contenu
              consultable.
            </span>
          )}

          {!item.is_read ? (
            <Button variant="ghost" size="sm" onClick={() => onRead(item.id)} disabled={busy}>
              Marquer comme lue
            </Button>
          ) : null}

          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Supprimer cette notification"
            title="Supprimer cette notification"
            onClick={() => onDelete(item)}
            disabled={busy}
          >
            <Icon name="trash" size={16} />
          </Button>
        </div>
      </div>
    </li>
  )
}

/* -------------------------------------------------------------------------- */

/**
 * Mes notifications.
 *
 * Tout vient de `src/services/notifications.ts` via les hooks du socle : la
 * pastille « non lue » reflete la colonne `is_read`, et aucune notification
 * n'est fabriquee cote client (la table n'a d'ailleurs AUCUNE policy INSERT,
 * elles ne peuvent venir que des declencheurs de la base).
 */
export function NotificationsScreen() {
  const { user } = useAuth()
  const toast = useToast()

  const list = useNotifications()
  const unread = useUnreadCount()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()
  const remove = useDeleteNotification()
  const removeRead = useDeleteReadNotifications()

  const [pendingDelete, setPendingDelete] = useState<NotificationItem | null>(null)
  const [confirmPurge, setConfirmPurge] = useState(false)

  const items = useMemo(
    () => (list.data?.pages ?? []).flatMap((page) => page.items),
    [list.data],
  )
  const slugs = useNotificationSlugs(items)
  const groups = useMemo(() => groupByDay(items), [items])

  const unreadCount = unread.data ?? 0
  const hasRead = items.some((item) => item.is_read)

  function handleRead(id: string) {
    markRead.mutate(id, {
      onError: (error) => toast.error('Mise à jour impossible', readableError(error)),
    })
  }

  function handleMarkAll() {
    markAll.mutate(undefined, {
      onSuccess: () => toast.success('Toutes vos notifications sont marquees comme lues'),
      onError: (error) => toast.error('Mise à jour impossible', readableError(error)),
    })
  }

  if (!user) {
    return (
      <section className={`${s.page} page`}>
        <EmptyState
          title="Connectez-vous pour voir vos notifications"
          description="Les réponses, les réactions et les décisions de modération qui vous concernent arrivent ici."
          action={
            <Button as="link" to="/connexion" variant="primary">
              Se connecter
            </Button>
          }
        />
      </section>
    )
  }

  return (
    <section className={`${s.page} page`}>
      <header className={s.head}>
        <div className={s.headText}>
          <h1 className={s.title}>Notifications</h1>
          <p className={s.lead}>
            {unread.isPending
              ? 'Chargement du compteur…'
              : unreadCount > 0
                ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}.`
                : 'Tout est lu.'}
          </p>
        </div>

        <div className={s.headActions}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAll}
            loading={markAll.isPending}
            disabled={unreadCount === 0}
            iconLeft={<Icon name="check" size={16} />}
          >
            Tout marquer comme lu
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmPurge(true)}
            disabled={!hasRead || removeRead.isPending}
            iconLeft={<Icon name="trash" size={16} />}
          >
            Supprimer les lues
          </Button>
        </div>
      </header>

      {list.isPending ? (
        <div className={s.groups} aria-busy="true">
          <Skeleton width={140} height="1rem" />
          <Skeleton height={96} radius="lg" />
          <Skeleton height={96} radius="lg" />
        </div>
      ) : list.isError && items.length === 0 ? (
        <ErrorState
          error={list.error}
          title="Notifications indisponibles"
          onRetry={() => void list.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          illustration={<Icon name="bell" size={38} />}
          title="Aucune notification"
          description="Dès qu'un membre repondra a vos messages ou qu'une de vos découvertes sera relue, vous le saurez ici."
        />
      ) : (
        <div className={s.groups}>
          {groups.map((group) => (
            <section key={group.key} className={s.group}>
              <h2 className={s.groupLabel}>{group.label}</h2>
              <ul className={s.list}>
                {group.items.map((item) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    slugs={slugs}
                    onRead={handleRead}
                    onDelete={setPendingDelete}
                    busy={markRead.isPending || remove.isPending}
                  />
                ))}
              </ul>
            </section>
          ))}

          {list.isError ? (
            <ErrorState
              compact
              error={list.error}
              title="La suite n'a pas pu être chargée"
              onRetry={() => void list.fetchNextPage()}
            />
          ) : null}

          {list.hasNextPage ? (
            <div className={s.more}>
              <Button
                variant="secondary"
                onClick={() => void list.fetchNextPage()}
                loading={list.isFetchingNextPage}
                iconLeft={<Icon name="chevron-down" size={18} />}
              >
                Voir plus
              </Button>
            </div>
          ) : null}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Supprimer cette notification ?"
        message={
          pendingDelete
            ? `« ${pendingDelete.title} » sera definitivement supprimee. Cette action est irreversible.`
            : ''
        }
        confirmLabel="Supprimer"
        loading={remove.isPending}
        onConfirm={() => {
          if (!pendingDelete) return
          remove.mutate(pendingDelete.id, {
            onSuccess: () => setPendingDelete(null),
            onError: (error) => {
              toast.error('Suppression impossible', readableError(error))
              setPendingDelete(null)
            },
          })
        }}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={confirmPurge}
        title="Supprimer toutes les notifications lues ?"
        message="Les notifications déjà lues seront définitivement supprimées. Les non lues sont conservées. Cette action est irréversible."
        confirmLabel="Supprimer les lues"
        loading={removeRead.isPending}
        onConfirm={() =>
          removeRead.mutate(undefined, {
            onSuccess: () => {
              setConfirmPurge(false)
              toast.success('Notifications lues supprimées')
            },
            onError: (error) => {
              setConfirmPurge(false)
              toast.error('Suppression impossible', readableError(error))
            },
          })
        }
        onCancel={() => setConfirmPurge(false)}
      />
    </section>
  )
}

export default NotificationsScreen
