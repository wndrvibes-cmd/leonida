import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '@/app/AuthProvider'
import { Icon } from '@/components/ui'
import { qk } from '@/lib/queryKeys'
import { supabase } from '@/lib/supabase'
import s from './NotificationsBell.module.css'

/**
 * Cloche de notifications.
 *
 * Le compteur n'est affiche que s'il est reellement superieur a zero : aucune
 * pastille decorative, aucun nombre en dur. En cas d'erreur de requete la
 * cloche reste muette — ce n'est pas un contenu critique, et un faux « 0 »
 * serait plus trompeur qu'un silence.
 */
export function NotificationsBell() {
  const { user } = useAuth()
  const userId = user?.id

  const { data: unread } = useQuery({
    queryKey: qk.unreadCount,
    enabled: Boolean(userId),
    staleTime: 30_000,
    queryFn: async (): Promise<number> => {
      if (!userId) return 0
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)
      if (error) throw error
      return count ?? 0
    },
  })

  const count = unread ?? 0
  const label = count > 0
    ? `Notifications, ${count} non ${count > 1 ? 'lues' : 'lue'}`
    : 'Notifications'

  return (
    <Link to="/notifications" className={s.bell} aria-label={label}>
      <Icon name="bell" size={22} />
      {count > 0 && (
        <span className={s.badge} aria-hidden="true">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}

export default NotificationsBell
