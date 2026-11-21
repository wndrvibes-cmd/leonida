import { useEffect, useState } from 'react'
import {
  useInfiniteQuery, useMutation, useQuery, useQueryClient,
  type UseInfiniteQueryResult, type InfiniteData, type UseQueryResult,
} from '@tanstack/react-query'
import { qk } from '@/lib/queryKeys'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/AuthProvider'
import {
  deleteNotification, deleteReadNotifications, listNotifications, markAllRead, markRead,
  unreadCount, type NotificationItem,
} from '@/services/notifications'
import type { Page } from '@/services/query'

/**
 * Intervalle de rafraichissement du compteur.
 *
 * POURQUOI UN SONDAGE EN PLUS DU TEMPS REEL : la table `notifications` n'est
 * pas (encore) ajoutee a la publication `supabase_realtime` cote base. Sans
 * cela, l'abonnement se connecte mais ne recoit jamais d'evenement. Le sondage
 * garantit donc que la pastille est juste dans tous les cas ; il reste leger
 * (une requete COUNT) et s'arrete quand l'onglet est en arriere-plan.
 */
const UNREAD_POLL_MS = 90 * 1000

export function useNotifications(): UseInfiniteQueryResult<
  InfiniteData<Page<NotificationItem>>,
  Error
> {
  const { user } = useAuth()

  return useInfiniteQuery({
    queryKey: [...qk.notifications, user?.id ?? 'anonyme'],
    queryFn: ({ pageParam }) => listNotifications(user?.id as string, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(user),
  })
}

export function useUnreadCount(): UseQueryResult<number> {
  const { user } = useAuth()

  return useQuery({
    queryKey: [...qk.unreadCount, user?.id ?? 'anonyme'],
    queryFn: () => unreadCount(user?.id as string),
    enabled: Boolean(user),
    refetchInterval: UNREAD_POLL_MS,
    // Exception au reglage global : revenir sur l'onglet doit rafraichir la
    // pastille, c'est le premier endroit ou le membre regarde.
    refetchOnWindowFocus: true,
  })
}

/** Invalide la liste et le compteur : le prefixe `['notifications']` couvre les deux. */
function useNotificationsInvalidation() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: qk.notifications })
  }
}

export function useMarkNotificationRead() {
  const invalidate = useNotificationsInvalidation()
  return useMutation({
    mutationFn: (id: string) => markRead(id, true),
    onSuccess: invalidate,
  })
}

export function useMarkAllNotificationsRead() {
  const { user } = useAuth()
  const invalidate = useNotificationsInvalidation()

  return useMutation({
    mutationFn: () => {
      if (!user) throw new Error('Session expirée.')
      return markAllRead(user.id)
    },
    onSuccess: invalidate,
  })
}

export function useDeleteNotification() {
  const invalidate = useNotificationsInvalidation()
  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: invalidate,
  })
}

export function useDeleteReadNotifications() {
  const { user } = useAuth()
  const invalidate = useNotificationsInvalidation()

  return useMutation({
    mutationFn: () => {
      if (!user) throw new Error('Session expirée.')
      return deleteReadNotifications(user.id)
    },
    onSuccess: invalidate,
  })
}

/* ============================================================ TEMPS REEL == */

export type RealtimeStatus = 'inactif' | 'connexion' | 'connecte' | 'indisponible'

/**
 * Abonnement temps reel aux nouvelles notifications du membre.
 *
 * A monter UNE SEULE FOIS, haut dans l'arbre (layout applicatif) : plusieurs
 * instances ouvriraient plusieurs canaux pour rien.
 *
 * Le filtre `user_id=eq.<id>` est applique cote serveur et la RLS s'applique
 * aussi au temps reel : un membre ne peut pas ecouter les notifications d'un
 * autre, meme en modifiant ce code.
 *
 * Le canal est retire au demontage (`removeChannel`), ce qui ferme la
 * souscription et libere la connexion WebSocket.
 */
export function useNotificationsRealtime(): RealtimeStatus {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const userId = user?.id
  const [status, setStatus] = useState<RealtimeStatus>('inactif')

  useEffect(() => {
    if (!userId) {
      setStatus('inactif')
      return
    }

    setStatus('connexion')

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: qk.notifications })
        },
      )
      .subscribe((state) => {
        if (state === 'SUBSCRIBED') setStatus('connecte')
        else if (state === 'CLOSED') setStatus('inactif')
        else setStatus('indisponible')
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [queryClient, userId])

  return status
}
