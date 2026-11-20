import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { fetchAuthorMap, type AuthorSummary } from './authors'
import { safeLimit, sliceToPage, unwrap, unwrapCount, unwrapVoid, type Page } from './query'

type NotificationRow = Database['public']['Tables']['notifications']['Row']

export type Notification = NotificationRow

/** `actor` est le membre a l'origine de la notification, `null` si systeme. */
export type NotificationItem = NotificationRow & { actor: AuthorSummary | null }

/**
 * Notifications du membre connecte, paginees par curseur sur `created_at`
 * (index `notifications_user_idx`).
 *
 * La RLS restreint deja a `user_id = auth.uid()` ; le filtre explicite sert a
 * utiliser l'index et a rendre l'intention lisible.
 */
export async function listNotifications(
  userId: string,
  cursor?: string | null,
  limit = 20,
): Promise<Page<NotificationItem>> {
  const size = safeLimit(limit)

  let query = supabase.from('notifications').select('*').eq('user_id', userId)
  if (cursor) query = query.lt('created_at', cursor)

  const rows = unwrap(await query.order('created_at', { ascending: false }).limit(size + 1))
  const page = sliceToPage(rows, size, (row) => row.created_at)

  // `actor_id` reference auth.users : le profil se recupere a part.
  const actors = await fetchAuthorMap(page.items.map((row) => row.actor_id))

  return {
    items: page.items.map((row) => ({
      ...row,
      actor: row.actor_id ? actors.get(row.actor_id) ?? null : null,
    })),
    nextCursor: page.nextCursor,
  }
}

export async function unreadCount(userId: string): Promise<number> {
  return unwrapCount(
    await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false),
  )
}

export async function markRead(id: string, isRead = true): Promise<void> {
  unwrapVoid(await supabase.from('notifications').update({ is_read: isRead }).eq('id', id))
}

export async function markAllRead(userId: string): Promise<void> {
  unwrapVoid(
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false),
  )
}

export async function deleteNotification(id: string): Promise<void> {
  unwrapVoid(await supabase.from('notifications').delete().eq('id', id))
}

/**
 * Supprime toutes les notifications deja lues du membre.
 * Les notifications non lues sont conservees : on ne fait pas disparaitre une
 * information que le membre n'a pas encore vue.
 */
export async function deleteReadNotifications(userId: string): Promise<void> {
  unwrapVoid(
    await supabase.from('notifications').delete().eq('user_id', userId).eq('is_read', true),
  )
}
