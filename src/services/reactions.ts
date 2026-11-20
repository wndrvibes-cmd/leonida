import { supabase } from '@/lib/supabase'
import { REACTIONS } from '@/lib/constants'
import type { Database } from '@/types/database'
import { unwrap, unwrapCount, unwrapMaybe, unwrapVoid } from './query'

type TargetType = Database['public']['Enums']['target_type']
type ReactionType = Database['public']['Enums']['reaction_type']

export interface ReactionSummary {
  /** Nombre exact par type, toutes les cles presentes (0 compris). */
  counts: Record<ReactionType, number>
  total: number
  /** Reaction du membre connecte, `null` s'il n'a pas reagi ou n'est pas connecte. */
  mine: ReactionType | null
}

function emptyCounts(): Record<ReactionType, number> {
  const counts = {} as Record<ReactionType, number>
  for (const reaction of REACTIONS) counts[reaction.value] = 0
  return counts
}

/**
 * Reactions du membre sur PLUSIEURS contenus, en une seule requete.
 *
 * C'est la fonction a utiliser dans un FEED : `getReactionSummary` coute six
 * requetes par contenu, soit plus de cent pour une page de vingt publications.
 * Le total affiche vient de `posts.reaction_count` (compteur tenu a jour par
 * un declencheur), et ce lot indique seulement ce que le membre a deja vote.
 */
export async function getMyReactions(
  userId: string,
  targetType: TargetType,
  targetIds: string[],
): Promise<Map<string, ReactionType>> {
  const unique = Array.from(new Set(targetIds))
  if (unique.length === 0) return new Map()

  const rows = unwrap(
    await supabase
      .from('reactions')
      .select('target_id,reaction')
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .in('target_id', unique)
      .limit(unique.length),
  )

  return new Map(rows.map((row) => [row.target_id, row.reaction]))
}

/**
 * Comptes REELS par type de reaction.
 *
 * A RESERVER AUX PAGES DE DETAIL : six requetes par appel. Pour une liste,
 * utiliser `getMyReactions` ci-dessus.
 *
 * POURQUOI UNE REQUETE PAR TYPE : PostgREST ne sait pas faire de `GROUP BY`
 * sans vue ni fonction dediee. On lance donc cinq `count: 'exact'` en
 * `head: true` (aucune ligne transferee, index `reactions_target_idx`), en
 * parallele. Charger toutes les lignes pour les compter cote client serait non
 * borne, et `posts.reaction_count` ne donne que le total, pas la repartition.
 */
export async function getReactionSummary(
  targetType: TargetType,
  targetId: string,
  userId?: string | null,
): Promise<ReactionSummary> {
  const [perType, mine] = await Promise.all([
    Promise.all(
      REACTIONS.map((reaction) =>
        supabase
          .from('reactions')
          .select('user_id', { count: 'exact', head: true })
          .eq('target_type', targetType)
          .eq('target_id', targetId)
          .eq('reaction', reaction.value),
      ),
    ),
    userId
      ? supabase
          .from('reactions')
          .select('reaction')
          .eq('target_type', targetType)
          .eq('target_id', targetId)
          .eq('user_id', userId)
          .maybeSingle()
      : null,
  ])

  const counts = emptyCounts()
  let total = 0

  REACTIONS.forEach((reaction, index) => {
    const value = unwrapCount(perType[index])
    counts[reaction.value] = value
    total += value
  })

  return { counts, total, mine: mine ? (unwrapMaybe(mine)?.reaction ?? null) : null }
}

/**
 * Pose ou remplace la reaction du membre.
 *
 * La cle primaire `(user_id, target_type, target_id)` garantit cote base
 * qu'un membre ne compte qu'une fois : l'upsert sur cette cle remplace la
 * reaction precedente au lieu d'en ajouter une.
 */
export async function setReaction(
  userId: string,
  targetType: TargetType,
  targetId: string,
  reaction: ReactionType,
): Promise<void> {
  unwrapVoid(
    await supabase.from('reactions').upsert(
      { user_id: userId, target_type: targetType, target_id: targetId, reaction },
      { onConflict: 'user_id,target_type,target_id' },
    ),
  )
}

export async function removeReaction(
  userId: string,
  targetType: TargetType,
  targetId: string,
): Promise<void> {
  unwrapVoid(
    await supabase
      .from('reactions')
      .delete()
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .eq('target_id', targetId),
  )
}

/**
 * Bascule : la meme reaction deux fois la retire, une autre la remplace.
 * Renvoie la reaction finalement active.
 */
export async function toggleReaction(
  userId: string,
  targetType: TargetType,
  targetId: string,
  reaction: ReactionType,
  current: ReactionType | null,
): Promise<ReactionType | null> {
  if (current === reaction) {
    await removeReaction(userId, targetType, targetId)
    return null
  }
  await setReaction(userId, targetType, targetId, reaction)
  return reaction
}
