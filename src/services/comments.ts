import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { attachAuthors, type WithAuthor } from './authors'
import { unwrap, unwrapCount, unwrapMaybe, unwrapVoid } from './query'

type CommentRow = Database['public']['Tables']['comments']['Row']
type TargetType = Database['public']['Enums']['target_type']

export type CommentItem = WithAuthor<CommentRow>

/** Une racine et ses reponses, aplaties sur un seul niveau d'affichage. */
export interface CommentNode extends CommentItem {
  replies: CommentItem[]
}

export interface CommentTree {
  roots: CommentNode[]
  /** Nombre de commentaires reellement charges (racines + reponses). */
  total: number
  /** `true` si le plafond a ete atteint : il existe d'autres commentaires. */
  truncated: boolean
}

/**
 * Plafond volontaire. Un fil de discussion au-dela de ce volume demande une
 * pagination dediee ; mieux vaut l'annoncer (`truncated`) que de charger
 * indefiniment sur un reseau mobile.
 */
const MAX_COMMENTS = 300

/**
 * Arbre des commentaires d'un contenu.
 *
 * Les commentaires sont charges a plat (un seul aller-retour, index
 * `comments_target_idx`) puis assembles ici. Une reponse de reponse est
 * rattachee a sa RACINE et non a son parent direct : l'interface reste lisible
 * sur iPhone et aucun commentaire n'est perdu en route.
 */
export async function listComments(
  targetType: TargetType,
  targetId: string,
): Promise<CommentTree> {
  const rows = unwrap(
    await supabase
      .from('comments')
      .select('*')
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .order('created_at', { ascending: true })
      .limit(MAX_COMMENTS + 1),
  )

  const truncated = rows.length > MAX_COMMENTS
  const kept = truncated ? rows.slice(0, MAX_COMMENTS) : rows

  const hydrated = await attachAuthors(kept, (row) => row.author_id)

  const byId = new Map<string, CommentItem>(hydrated.map((row) => [row.id, row]))
  const nodes = new Map<string, CommentNode>()
  const roots: CommentNode[] = []

  // 1er passage : les racines.
  for (const row of hydrated) {
    if (row.parent_id) continue
    const node: CommentNode = { ...row, replies: [] }
    nodes.set(row.id, node)
    roots.push(node)
  }

  // 2e passage : chaque reponse remonte jusqu'a sa racine.
  for (const row of hydrated) {
    if (!row.parent_id) continue

    let currentId: string | null = row.parent_id
    const seen = new Set<string>([row.id])

    while (currentId && !nodes.has(currentId)) {
      if (seen.has(currentId)) break // garde-fou : cycle impossible mais gratuit
      seen.add(currentId)
      currentId = byId.get(currentId)?.parent_id ?? null
    }

    const root = currentId ? nodes.get(currentId) : undefined
    // Parent hors du lot charge (masque, supprime) : la reponse devient racine
    // plutot que de disparaitre.
    if (root) root.replies.push(row)
    else roots.push({ ...row, replies: [] })
  }

  roots.sort((a, b) => a.created_at.localeCompare(b.created_at))

  return { roots, total: hydrated.length, truncated }
}

export async function countComments(targetType: TargetType, targetId: string): Promise<number> {
  return unwrapCount(
    await supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .eq('is_hidden', false),
  )
}

/* ================================================================ ECRITURE = */

export interface CreateCommentInput {
  /** Doit etre l'identifiant du membre connecte : la RLS le verifie. */
  authorId: string
  targetType: TargetType
  targetId: string
  parentId?: string | null
  body: string
}

export async function createComment(input: CreateCommentInput): Promise<CommentRow> {
  const body = input.body.trim()
  if (!body) throw new Error('Le commentaire ne peut pas etre vide.')

  return unwrap(
    await supabase
      .from('comments')
      .insert({
        author_id: input.authorId,
        target_type: input.targetType,
        target_id: input.targetId,
        parent_id: input.parentId ?? null,
        body,
      })
      .select('*')
      .single(),
  )
}

export async function updateComment(id: string, body: string): Promise<CommentRow> {
  const next = body.trim()
  if (!next) throw new Error('Le commentaire ne peut pas etre vide.')

  const row = unwrapMaybe(
    await supabase.from('comments').update({ body: next }).eq('id', id).select('*').maybeSingle(),
  )
  if (!row) throw new Error('Commentaire introuvable ou modification refusee.')
  return row
}

export async function deleteComment(id: string): Promise<void> {
  unwrapVoid(await supabase.from('comments').delete().eq('id', id))
}
