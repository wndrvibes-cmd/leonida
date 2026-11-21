import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { unwrap, unwrapMaybe } from './query'

type ContestRow = Database['public']['Tables']['contests']['Row']

export type Contest = ContestRow

export interface ListContestsOptions {
  /** `contest` | `gift` | `reward` | `offer` | `event` (voir CONTEST_CATEGORY_LABELS). */
  category?: string
  /**
   * `true`  : uniquement les operations ouvertes maintenant ;
   * `false` : uniquement celles qui sont terminees ;
   * absent  : tout ce qui est publie.
   */
  active?: boolean
  limit?: number
}

const CONTESTS_LIMIT = 60

/**
 * Concours et cadeaux publies.
 *
 * Le filtre `active` compare les dates cote BASE (`now()` PostgreSQL via une
 * date ISO transmise) et non cote client : un appareil mal regle ne doit pas
 * faire apparaitre une operation deja close.
 */
export async function listContests(options: ListContestsOptions = {}): Promise<ContestRow[]> {
  const nowIso = new Date().toISOString()

  let query = supabase.from('contests').select('*').eq('status', 'published')

  if (options.category) query = query.eq('category', options.category)

  if (options.active === true) {
    query = query
      .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
      .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
  } else if (options.active === false) {
    query = query.not('ends_at', 'is', null).lt('ends_at', nowIso)
  }

  const limit = Math.min(Math.max(options.limit ?? CONTESTS_LIMIT, 1), CONTESTS_LIMIT)

  return unwrap(
    await query
      .order('is_featured', { ascending: false })
      .order('ends_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit),
  )
}

/** `null` si l'opération n'existe pas ou n'est pas publiee. */
export async function getContestBySlug(slug: string): Promise<ContestRow | null> {
  return unwrapMaybe(await supabase.from('contests').select('*').eq('slug', slug).maybeSingle())
}

/** `true` si l'opération accepte encore des participations a l'instant demande. */
export function isContestOpen(contest: ContestRow, now = new Date()): boolean {
  if (contest.status !== 'published') return false
  if (contest.starts_at && new Date(contest.starts_at) > now) return false
  if (contest.ends_at && new Date(contest.ends_at) < now) return false
  return true
}
