import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { unwrap } from '@/services/query'
import type { NotificationItem } from '@/services/notifications'
import type { Database } from '@/types/database'

type TargetType = Database['public']['Enums']['target_type']

/**
 * Adresse interne d'une notification.
 *
 * La colonne `notifications.link` existe, mais AUCUN declencheur ne la
 * remplit aujourd'hui (migrations 0003 et 0004) : elle vaut donc `null` en
 * pratique. On la respecte quand elle est renseignee, et sinon on reconstruit
 * l'adresse depuis `(target_type, target_id)`.
 *
 * Les actualites et les concours s'ouvrent par SLUG, alors que la
 * notification ne transporte qu'un identifiant : leurs slugs sont resolus en
 * une requete groupee par page (`useNotificationSlugs`). Sans slug, aucun lien
 * n'est propose — plutot que d'offrir un lien qui tomberait sur une page 404.
 */

/** Slugs resolus, indexes par identifiant de contenu. */
export type SlugIndex = Map<string, string>

function idsOf(items: NotificationItem[], kind: TargetType): string[] {
  return Array.from(
    new Set(
      items
        .filter((item) => item.target_type === kind && item.target_id)
        .map((item) => item.target_id as string),
    ),
  )
}

/**
 * Resout les slugs des actualites et concours cites par la page courante.
 * Aucune requete n'est lancee si aucune notification ne les concerne.
 */
export function useNotificationSlugs(items: NotificationItem[]): SlugIndex {
  const newsIds = idsOf(items, 'news')
  const contestIds = idsOf(items, 'contest')
  const signature = [...newsIds, ...contestIds].sort().join('|')

  const query = useQuery({
    queryKey: ['notifications', 'slugs', signature],
    queryFn: async (): Promise<[string, string][]> => {
      const [news, contests] = await Promise.all([
        newsIds.length
          ? supabase.from('news_articles').select('id,slug').in('id', newsIds).limit(newsIds.length)
          : null,
        contestIds.length
          ? supabase.from('contests').select('id,slug').in('id', contestIds).limit(contestIds.length)
          : null,
      ])

      const pairs: [string, string][] = []
      if (news) for (const row of unwrap(news)) pairs.push([row.id, row.slug])
      if (contests) for (const row of unwrap(contests)) pairs.push([row.id, row.slug])
      return pairs
    },
    enabled: signature.length > 0,
    staleTime: 5 * 60 * 1000,
  })

  return new Map(query.data ?? [])
}

/** `null` quand la cible n'est pas atteignable : on n'affiche alors aucun lien. */
export function notificationLink(item: NotificationItem, slugs: SlugIndex): string | null {
  // Lien explicite (pose par du code serveur, le jour ou il en posera un).
  if (item.link && item.link.startsWith('/')) return item.link

  if (!item.target_type || !item.target_id) return null

  switch (item.target_type) {
    case 'post':
      return `/communaute/${item.target_id}`
    case 'marker':
      return `/carte?decouverte=${item.target_id}`
    case 'news': {
      const slug = slugs.get(item.target_id)
      return slug ? `/actualites/${slug}` : null
    }
    case 'contest': {
      const slug = slugs.get(item.target_id)
      return slug ? `/cadeaux/${slug}` : null
    }
    case 'comment':
      // `target_id` designe le commentaire parent, dont le fil n'est pas
      // retrouvable sans requete supplementaire : pas de lien devine.
      return null
    default:
      return null
  }
}
