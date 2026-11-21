import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { unwrapCount, unwrapMaybe, unwrapVoid } from './query'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Profile = ProfileRow

/**
 * Champs qu'un membre peut reellement modifier sur son profil.
 *
 * `is_suspended`, `suspended_at` et `suspension_reason` sont volontairement
 * absents : le declencheur `tg_protect_profile_fields` les restaure cote base
 * si on tentait de les ecrire. Les exclure ici evite d'ecrire un appel qui
 * serait silencieusement annule.
 */
export type ProfileEditable = Pick<
  ProfileUpdate,
  'username' | 'display_name' | 'bio' | 'avatar_url' | 'banner_url' | 'location'
>

/** `null` si le profil n'existe pas (compte supprime, identifiant errone). */
export async function getProfile(id: string): Promise<Profile | null> {
  return unwrapMaybe(await supabase.from('profiles').select('*').eq('id', id).maybeSingle())
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  return unwrapMaybe(
    await supabase.from('profiles').select('*').eq('username', username).maybeSingle(),
  )
}

/**
 * Mise a jour du profil. La RLS n'autorise que son propre profil (ou le staff) :
 * on passe l'identifiant explicitement plutôt que de deviner l'appelant.
 */
export async function updateProfile(id: string, patch: ProfileEditable): Promise<Profile> {
  const row = unwrapMaybe(
    await supabase.from('profiles').update(patch).eq('id', id).select('*').maybeSingle(),
  )
  if (!row) {
    throw new Error("Le profil n'a pas pu être mis à jour : droits insuffisants ou profil absent.")
  }
  return row
}

/* ================================================= STATISTIQUES REELLES === */

export interface ProfileStats {
  /** Publications visibles sur la surface communaute. */
  posts: number
  /** Publications visibles sur la surface moments. */
  moments: number
  /**
   * Decouvertes proposees, tous statuts confondus.
   * `null` quand le visiteur n'a pas le droit de voir les brouillons et les
   * contributions en attente de l'auteur : afficher un total partiel en le
   * presentant comme complet serait faux, on prefere ne rien afficher.
   */
  markersProposed: number | null
  /** Decouvertes validees et publiees sur la carte. */
  markersApproved: number
}

/**
 * Compte REEL, par `count: 'exact'` sans transfert de lignes.
 * Aucun chiffre n'est estime ni mis en cache en dur.
 *
 * `includeDrafts` doit valoir `true` uniquement quand l'appelant est l'auteur
 * lui-meme ou un membre du staff : c'est la RLS qui decide vraiment, le drapeau
 * ne sert qu'a savoir si le total obtenu est complet.
 */
export async function getProfileStats(
  userId: string,
  options: { includeDrafts?: boolean } = {},
): Promise<ProfileStats> {
  const { includeDrafts = false } = options

  const [posts, moments, approved, proposed] = await Promise.all([
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', userId)
      .eq('surface', 'community')
      .eq('is_hidden', false),
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', userId)
      .eq('surface', 'moment')
      .eq('is_hidden', false),
    supabase
      .from('map_markers')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', userId)
      .eq('status', 'approved'),
    includeDrafts
      ? supabase
          .from('map_markers')
          .select('id', { count: 'exact', head: true })
          .eq('author_id', userId)
      : null,
  ])

  return {
    posts: unwrapCount(posts),
    moments: unwrapCount(moments),
    markersApproved: unwrapCount(approved),
    markersProposed: proposed ? unwrapCount(proposed) : null,
  }
}

/* ========================================================== DISPONIBILITE = */

/**
 * `true` si le pseudonyme est libre. Indicatif seulement : la contrainte
 * d'unicité de la base reste l'arbitre final au moment de l'enregistrement.
 */
export async function isUsernameAvailable(username: string, exceptUserId?: string): Promise<boolean> {
  let query = supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('username', username)
  if (exceptUserId) query = query.neq('id', exceptUserId)
  return unwrapCount(await query) === 0
}

/* ============================================================ SUSPENSION == */

/**
 * Reserve au staff (policy `profiles_staff_update` + declencheur).
 * Expose ici pour que `admin.ts` et le profil partagent la meme ecriture.
 */
export async function setSuspension(
  userId: string,
  suspended: boolean,
  reason: string | null,
): Promise<void> {
  unwrapVoid(
    await supabase
      .from('profiles')
      .update({
        is_suspended: suspended,
        suspended_at: suspended ? new Date().toISOString() : null,
        suspension_reason: suspended ? reason : null,
      })
      .eq('id', userId),
  )
}
