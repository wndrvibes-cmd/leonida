import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { setSuspension } from './profiles'
import {
  ilikeValue, MIN_SEARCH_LENGTH, safeLimit, sanitizeSearch, sliceToPage, unwrap,
  unwrapCount, unwrapMaybe, unwrapVoid, type Page,
} from './query'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type ReportRow = Database['public']['Tables']['reports']['Row']
type MediaAssetRow = Database['public']['Tables']['media_assets']['Row']
type AppRole = Database['public']['Enums']['app_role']
type ReportStatus = Database['public']['Enums']['report_status']

export type { MarkerListItem } from './map'
/** La file de moderation vit avec le reste de la carte : une seule source. */
export { listPendingMarkers, reviewMarker, setMarkerVerification } from './map'

/* ================================================= TABLEAU DE BORD ======== */

export interface DashboardStats {
  members: number
  /**
   * `null` quand l'appelant n'est pas administrateur : la table
   * `subscriptions` lui est fermee par la RLS et renverrait 0, ce qui serait
   * un chiffre FAUX. L'interface doit alors afficher « non disponible ».
   */
  premium: number | null
  posts: number
  moments: number
  pendingMarkers: number
  openReports: number
  publishedNews: number
  activeContests: number
}

/**
 * Comptes REELS : chaque valeur vient d'un `count: 'exact'` avec `head: true`
 * (aucune ligne transferee). Aucun chiffre n'est estime, arrondi ou ecrit en
 * dur. Les huit requetes partent en parallele.
 */
export async function getDashboardStats(
  options: { includePremium?: boolean } = {},
): Promise<DashboardStats> {
  const nowIso = new Date().toISOString()

  const [members, premium, posts, moments, pendingMarkers, openReports, news, contests] =
    await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      options.includePremium
        ? supabase
            .from('subscriptions')
            .select('user_id', { count: 'exact', head: true })
            .in('status', ['active', 'trialing'])
            .or(`current_period_end.is.null,current_period_end.gt.${nowIso}`)
        : null,
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('surface', 'community')
        .eq('is_hidden', false),
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('surface', 'moment')
        .eq('is_hidden', false),
      supabase
        .from('map_markers')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .in('status', ['pending', 'reviewing']),
      supabase
        .from('news_articles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published'),
      supabase
        .from('contests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')
        .or(`ends_at.is.null,ends_at.gte.${nowIso}`),
    ])

  return {
    members: unwrapCount(members),
    premium: premium ? unwrapCount(premium) : null,
    posts: unwrapCount(posts),
    moments: unwrapCount(moments),
    pendingMarkers: unwrapCount(pendingMarkers),
    openReports: unwrapCount(openReports),
    publishedNews: unwrapCount(news),
    activeContests: unwrapCount(contests),
  }
}

/* ======================================================== MEMBRES ========= */

export interface MemberEntry {
  profile: ProfileRow
  /** `null` si l'appelant n'est pas administrateur (`user_roles` lui est ferme). */
  roles: AppRole[] | null
  /** `null` si l'appelant n'est pas administrateur (`subscriptions` ferme). */
  isPremium: boolean | null
}

export interface ListMembersOptions {
  q?: string
  suspended?: boolean
  cursor?: string | null
  limit?: number
  /**
   * A passer UNIQUEMENT quand l'appelant est administrateur (`isAdmin`).
   *
   * `user_roles` et `subscriptions` sont fermes aux moderateurs par la RLS :
   * avec cette option activee sans les droits, les requetes renvoient des
   * listes vides et chaque membre apparaitrait « sans role, non abonne », ce
   * qui serait FAUX. Laisse a `false`, les deux champs valent `null` et
   * l'interface affiche honnetement « non disponible ».
   */
  includePrivileges?: boolean
}

/**
 * Annuaire des membres, pagine par curseur sur `created_at`
 * (index `profiles_created_at_idx`).
 *
 * Les roles et le statut LEONIDA+ sont recuperes en deux requetes bornees sur
 * les identifiants de la page, et seulement si l'appelant est administrateur.
 */
export async function listMembers(
  options: ListMembersOptions = {},
): Promise<Page<MemberEntry>> {
  const limit = safeLimit(options.limit)

  let query = supabase.from('profiles').select('*')

  if (options.suspended !== undefined) query = query.eq('is_suspended', options.suspended)

  const term = sanitizeSearch(options.q)
  if (term.length >= MIN_SEARCH_LENGTH) {
    const value = ilikeValue(term)
    query = query.or(`username.ilike.${value},display_name.ilike.${value}`)
  }

  if (options.cursor) query = query.lt('created_at', options.cursor)

  const rows = unwrap(await query.order('created_at', { ascending: false }).limit(limit + 1))
  const page = sliceToPage(rows, limit, (row) => row.created_at)

  if (!options.includePrivileges || page.items.length === 0) {
    return {
      items: page.items.map((profile) => ({ profile, roles: null, isPremium: null })),
      nextCursor: page.nextCursor,
    }
  }

  const ids = page.items.map((row) => row.id)
  const nowIso = new Date().toISOString()

  const [roleRows, subscriptionRows] = await Promise.all([
    supabase.from('user_roles').select('user_id,role').in('user_id', ids).limit(ids.length * 3),
    supabase
      .from('subscriptions')
      .select('user_id,status,current_period_end')
      .in('user_id', ids)
      .in('status', ['active', 'trialing'])
      .limit(ids.length),
  ])

  const roles = new Map<string, AppRole[]>()
  for (const row of unwrap(roleRows)) {
    const list = roles.get(row.user_id)
    if (list) list.push(row.role)
    else roles.set(row.user_id, [row.role])
  }

  // Meme regle que la fonction `is_premium()` cote base : statut actif ET
  // periode non expiree.
  const premium = new Set<string>()
  for (const row of unwrap(subscriptionRows)) {
    if (!row.current_period_end || row.current_period_end > nowIso) premium.add(row.user_id)
  }

  return {
    items: page.items.map((profile) => ({
      profile,
      roles: roles.get(profile.id) ?? [],
      isPremium: premium.has(profile.id),
    })),
    nextCursor: page.nextCursor,
  }
}

/**
 * Attribue UN role et retire les autres : l'interface d'administration
 * presente un niveau unique par membre.
 *
 * NOTE : deux instructions successives, pas une transaction (PostgREST n'en
 * expose pas). L'ordre choisi — ajouter puis retirer — garantit que le membre
 * n'est jamais momentanement sans role.
 *
 * Seul un administrateur y parvient (`user_roles_admin_*`). Aucun membre ne
 * peut s'attribuer `admin` : il n'existe aucune policy d'ecriture pour lui.
 */
export async function setUserRole(userId: string, role: AppRole): Promise<void> {
  unwrapVoid(
    await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role }, { onConflict: 'user_id,role' }),
  )
  unwrapVoid(await supabase.from('user_roles').delete().eq('user_id', userId).neq('role', role))
}

export async function getUserRoles(userId: string): Promise<AppRole[]> {
  const rows = unwrap(
    await supabase.from('user_roles').select('role').eq('user_id', userId).limit(3),
  )
  return rows.map((row) => row.role)
}

/** Suspension : le motif est conserve en base et visible par le staff. */
export async function suspendUser(userId: string, reason: string): Promise<void> {
  const motive = reason.trim()
  if (!motive) throw new Error('Une suspension doit etre motivee.')
  await setSuspension(userId, true, motive)
}

export async function reinstateUser(userId: string): Promise<void> {
  await setSuspension(userId, false, null)
}

/* ================================================== SIGNALEMENTS ========== */

export interface ReportEntry {
  report: ReportRow
  /** Profil de l'auteur du signalement, `null` si le compte a disparu. */
  reporterUsername: string | null
}

export interface ListReportsOptions {
  status?: ReportStatus
  cursor?: string | null
  limit?: number
}

export async function listReports(
  options: ListReportsOptions = {},
): Promise<Page<ReportEntry>> {
  const limit = safeLimit(options.limit)

  let query = supabase.from('reports').select('*')
  if (options.status) query = query.eq('status', options.status)
  if (options.cursor) query = query.lt('created_at', options.cursor)

  const rows = unwrap(await query.order('created_at', { ascending: false }).limit(limit + 1))
  const page = sliceToPage(rows, limit, (row) => row.created_at)

  const reporterIds = Array.from(new Set(page.items.map((row) => row.reporter_id)))
  const reporters = reporterIds.length
    ? unwrap(
        await supabase
          .from('profiles')
          .select('id,username')
          .in('id', reporterIds)
          .limit(reporterIds.length),
      )
    : []

  const byId = new Map(reporters.map((row) => [row.id, row.username]))

  return {
    items: page.items.map((report) => ({
      report,
      reporterUsername: byId.get(report.reporter_id) ?? null,
    })),
    nextCursor: page.nextCursor,
  }
}

export interface ResolveReportInput {
  status: ReportStatus
  internalNote?: string | null
  /** Identifiant du moderateur qui tranche : trace la decision. */
  resolverId: string
}

/**
 * Cloture un signalement.
 *
 * `resolved_by` / `resolved_at` sont ecrits ici : aucun declencheur ne les
 * renseigne cote base pour cette table.
 */
export async function resolveReport(id: string, input: ResolveReportInput): Promise<ReportRow> {
  const closing = input.status === 'resolved' || input.status === 'dismissed'

  const row = unwrapMaybe(
    await supabase
      .from('reports')
      .update({
        status: input.status,
        internal_note: input.internalNote?.trim() || null,
        resolved_by: closing ? input.resolverId : null,
        resolved_at: closing ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select('*')
      .maybeSingle(),
  )
  if (!row) throw new Error('Signalement introuvable ou droits insuffisants.')
  return row
}

/* ===================================================== MEDIATHEQUE ======== */

export interface ListMediaOptions {
  folder?: string
  cursor?: string | null
  limit?: number
}

export async function listMedia(options: ListMediaOptions = {}): Promise<Page<MediaAssetRow>> {
  const limit = safeLimit(options.limit)

  let query = supabase.from('media_assets').select('*')
  if (options.folder) query = query.eq('folder', options.folder)
  if (options.cursor) query = query.lt('created_at', options.cursor)

  const rows = unwrap(await query.order('created_at', { ascending: false }).limit(limit + 1))
  return sliceToPage(rows, limit, (row) => row.created_at)
}

/**
 * Supprime un media : d'abord le fichier du bucket, ensuite la ligne.
 *
 * Cet ordre est volontaire. Si l'effacement du fichier echoue, la ligne reste
 * et le media demeure visible dans la mediatheque : on peut reessayer. Dans
 * l'ordre inverse, un echec laisserait un fichier orphelin invisible,
 * impossible a retrouver.
 */
export async function deleteMedia(id: string): Promise<void> {
  const asset = unwrapMaybe(
    await supabase.from('media_assets').select('bucket,path').eq('id', id).maybeSingle(),
  )
  if (!asset) throw new Error('Media introuvable.')

  const { error } = await supabase.storage.from(asset.bucket).remove([asset.path])
  if (error) throw new Error(`Le fichier n'a pas pu etre supprime du stockage : ${error.message}`)

  unwrapVoid(await supabase.from('media_assets').delete().eq('id', id))
}
