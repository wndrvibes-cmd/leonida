import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { attachAuthor, attachAuthors, type WithAuthor } from './authors'
import {
  ilikeValue, MIN_SEARCH_LENGTH, sanitizeSearch, unwrap, unwrapMaybe, unwrapVoid,
} from './query'
import { getSetting, parseMapConfig, SETTING_KEYS, type MapConfig } from './settings'

type MarkerRow = Database['public']['Tables']['map_markers']['Row']
type MapCategoryRow = Database['public']['Tables']['map_categories']['Row']
type MarkerStatus = Database['public']['Enums']['marker_status']
type VerificationLevel = Database['public']['Enums']['verification_level']

export type MapMarker = MarkerRow
export type MapCategory = MapCategoryRow
export type MarkerListItem = WithAuthor<MarkerRow>
export type { MapConfig }

/**
 * La carte affiche tous ses marqueurs d'un coup (ils deviennent des pastilles,
 * pas une liste paginee). Le plafond protege malgre tout le mobile d'un
 * chargement sans fin si la base grossit beaucoup.
 */
const MARKERS_HARD_LIMIT = 1000

function clampMarkerLimit(limit?: number): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) return MARKERS_HARD_LIMIT
  return Math.min(Math.max(Math.trunc(limit), 1), MARKERS_HARD_LIMIT)
}

export async function getMapConfig(): Promise<MapConfig> {
  return parseMapConfig(await getSetting(SETTING_KEYS.mapConfig))
}

export async function listCategories(includeInactive = false): Promise<MapCategoryRow[]> {
  let query = supabase.from('map_categories').select('*')
  if (!includeInactive) query = query.eq('is_active', true)
  return unwrap(await query.order('sort_order', { ascending: true }).limit(100))
}

export interface ListMarkersOptions {
  /** Identifiants de categories (voir `listCategories`). Vide = toutes. */
  categoryIds?: string[]
  q?: string
  /**
   * Par defaut `approved` : la carte publique ne montre QUE les decouvertes
   * validees. Les autres statuts ne remontent que pour leur auteur ou le
   * staff, et c'est la RLS qui le garantit.
   */
  status?: MarkerStatus
  limit?: number
}

export async function listMarkers(options: ListMarkersOptions = {}): Promise<MarkerRow[]> {
  const { categoryIds, status = 'approved' } = options

  let query = supabase.from('map_markers').select('*').eq('status', status)

  if (categoryIds && categoryIds.length > 0) query = query.in('category_id', categoryIds)

  const term = sanitizeSearch(options.q)
  if (term.length >= MIN_SEARCH_LENGTH) {
    const value = ilikeValue(term)
    query = query.or(`title.ilike.${value},description.ilike.${value}`)
  }

  return unwrap(
    await query.order('created_at', { ascending: false }).limit(clampMarkerLimit(options.limit)),
  )
}

/** `null` si la decouverte n'existe pas ou n'est pas visible par l'appelant. */
export async function getMarker(id: string): Promise<MarkerListItem | null> {
  const marker = unwrapMaybe(
    await supabase.from('map_markers').select('*').eq('id', id).maybeSingle(),
  )
  if (!marker) return null
  return attachAuthor(marker, (row) => row.author_id)
}

/* ====================================================== CONTRIBUTIONS ===== */

export interface CreateContributionInput {
  /** Doit etre l'identifiant du membre connecte : la RLS le verifie. */
  authorId: string
  title: string
  categoryId: string | null
  description?: string | null
  instructions?: string | null
  imageUrl?: string | null
  /** Coordonnees relatives 0..1 sur l'image d'origine. */
  x: number
  y: number
  authorTested?: boolean
  estimatedReward?: string | null
}

function assertCoordinate(value: number, axis: 'x' | 'y'): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(
      `Position ${axis} invalide : placez le repere sur la carte avant d'envoyer la decouverte.`,
    )
  }
}

/**
 * Depose une contribution. Le statut `pending` est envoye explicitement, ET
 * force cote base par `tg_protect_marker_fields` : une decouverte membre passe
 * TOUJOURS par la file de validation, meme si ce code etait contourne.
 *
 * `is_official`, `verification` et les champs de revision ne sont pas transmis :
 * le declencheur les impose. Un membre ne peut ni s'auto-valider ni se declarer
 * « Verifiee LEONIDA ».
 */
export async function createContribution(input: CreateContributionInput): Promise<MarkerRow> {
  const title = input.title.trim()
  if (title.length < 3) throw new Error('Le titre doit contenir au moins 3 caracteres.')
  assertCoordinate(input.x, 'x')
  assertCoordinate(input.y, 'y')

  return unwrap(
    await supabase
      .from('map_markers')
      .insert({
        author_id: input.authorId,
        title,
        category_id: input.categoryId,
        description: input.description?.trim() || null,
        instructions: input.instructions?.trim() || null,
        image_url: input.imageUrl ?? null,
        x: input.x,
        y: input.y,
        author_tested: input.authorTested ?? false,
        estimated_reward: input.estimatedReward?.trim() || null,
        status: 'pending',
      })
      .select('*')
      .single(),
  )
}

/** Champs qu'un auteur peut corriger tant que sa contribution n'est pas validee. */
export interface UpdateContributionInput {
  title?: string
  categoryId?: string | null
  description?: string | null
  instructions?: string | null
  imageUrl?: string | null
  x?: number
  y?: number
  authorTested?: boolean
  estimatedReward?: string | null
}

export async function updateMyContribution(
  id: string,
  patch: UpdateContributionInput,
): Promise<MarkerRow> {
  if (patch.x !== undefined) assertCoordinate(patch.x, 'x')
  if (patch.y !== undefined) assertCoordinate(patch.y, 'y')

  const row = unwrapMaybe(
    await supabase
      .from('map_markers')
      .update({
        ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
        ...(patch.categoryId !== undefined ? { category_id: patch.categoryId } : {}),
        ...(patch.description !== undefined
          ? { description: patch.description?.trim() || null }
          : {}),
        ...(patch.instructions !== undefined
          ? { instructions: patch.instructions?.trim() || null }
          : {}),
        ...(patch.imageUrl !== undefined ? { image_url: patch.imageUrl } : {}),
        ...(patch.x !== undefined ? { x: patch.x } : {}),
        ...(patch.y !== undefined ? { y: patch.y } : {}),
        ...(patch.authorTested !== undefined ? { author_tested: patch.authorTested } : {}),
        ...(patch.estimatedReward !== undefined
          ? { estimated_reward: patch.estimatedReward?.trim() || null }
          : {}),
      })
      .eq('id', id)
      .select('*')
      .maybeSingle(),
  )

  if (!row) {
    throw new Error(
      'Contribution introuvable ou non modifiable : une decouverte validee ne peut plus etre corrigee.',
    )
  }
  return row
}

/** Contributions d'un membre, tous statuts : c'est son suivi personnel. */
export async function listMyContributions(authorId: string): Promise<MarkerRow[]> {
  return unwrap(
    await supabase
      .from('map_markers')
      .select('*')
      .eq('author_id', authorId)
      .order('created_at', { ascending: false })
      .limit(200),
  )
}

export async function deleteMyContribution(id: string): Promise<void> {
  unwrapVoid(await supabase.from('map_markers').delete().eq('id', id))
}

/* ============================================================ MODERATION == */

/**
 * Decision de moderation (staff uniquement).
 * `reviewed_by` et `reviewed_at` sont renseignes par le declencheur : les
 * envoyer ici serait redondant et faux si l'horloge du client derive.
 * La notification de l'auteur est egalement emise cote base.
 */
export async function reviewMarker(
  id: string,
  status: MarkerStatus,
  reason?: string | null,
): Promise<MarkerRow> {
  if (status === 'rejected' && !reason?.trim()) {
    throw new Error('Un refus doit etre motive : le motif est envoye a l\'auteur.')
  }

  const row = unwrapMaybe(
    await supabase
      .from('map_markers')
      .update({
        status,
        rejection_reason: status === 'rejected' ? (reason?.trim() ?? null) : null,
      })
      .eq('id', id)
      .select('*')
      .maybeSingle(),
  )
  if (!row) throw new Error('Decouverte introuvable ou droits insuffisants.')
  return row
}

/**
 * Niveau de verification (staff uniquement).
 * `staff_verified` est la SEULE valeur qui autorise l'interface a afficher
 * « Verifiee LEONIDA » : ne jamais l'attribuer automatiquement.
 */
export async function setMarkerVerification(
  id: string,
  verification: VerificationLevel,
): Promise<MarkerRow> {
  const row = unwrapMaybe(
    await supabase
      .from('map_markers')
      .update({ verification })
      .eq('id', id)
      .select('*')
      .maybeSingle(),
  )
  if (!row) throw new Error('Decouverte introuvable ou droits insuffisants.')
  return row
}

/** File d'attente de moderation, avec l'auteur de chaque contribution. */
export async function listPendingMarkers(limit = 100): Promise<MarkerListItem[]> {
  const rows = unwrap(
    await supabase
      .from('map_markers')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(clampMarkerLimit(limit)),
  )
  return attachAuthors(rows, (row) => row.author_id)
}
