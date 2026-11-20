import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { unwrap } from './query'

/**
 * Hydratation des auteurs.
 *
 * POURQUOI UNE REQUETE SEPAREE : en base, `posts.author_id`, `comments.author_id`,
 * `map_markers.author_id` et `notifications.actor_id` referencent `auth.users(id)`,
 * PAS `public.profiles`. PostgREST ne peut donc pas imbriquer le profil dans la
 * requete (`author:profiles(...)` echouerait : aucune cle etrangere a suivre).
 * On recupere les profils en un seul appel `in(id, ...)` puis on assemble cote
 * client. Cout : une requete supplementaire par page, bornee par la page.
 */

const AUTHOR_COLUMNS = 'id,username,display_name,avatar_url,is_suspended' as const

type ProfileRow = Database['public']['Tables']['profiles']['Row']

export type AuthorSummary = Pick<
  ProfileRow,
  'id' | 'username' | 'display_name' | 'avatar_url' | 'is_suspended'
>

export type WithAuthor<T> = T & { author: AuthorSummary | null }

/** Profils des identifiants demandes, dedoublonnes. Map vide si rien a chercher. */
export async function fetchAuthorMap(
  ids: readonly (string | null | undefined)[],
): Promise<Map<string, AuthorSummary>> {
  const unique = Array.from(
    new Set(ids.filter((id): id is string => typeof id === 'string' && id.length > 0)),
  )
  if (unique.length === 0) return new Map()

  const rows = unwrap(
    await supabase.from('profiles').select(AUTHOR_COLUMNS).in('id', unique).limit(unique.length),
  )

  return new Map(rows.map((row) => [row.id, row]))
}

/**
 * Ajoute `author` a chaque ligne. Un auteur peut rester `null` : compte
 * supprime (`on delete set null`) ou profil illisible. L'interface doit donc
 * toujours gerer le cas « auteur inconnu », jamais inventer un nom.
 */
export async function attachAuthors<T extends object>(
  rows: T[],
  idOf: (row: T) => string | null,
): Promise<WithAuthor<T>[]> {
  if (rows.length === 0) return []
  const map = await fetchAuthorMap(rows.map(idOf))
  return rows.map((row) => {
    const id = idOf(row)
    return { ...row, author: (id ? map.get(id) : undefined) ?? null }
  })
}

/** Variante pour une ligne unique. */
export async function attachAuthor<T extends object>(
  row: T,
  idOf: (row: T) => string | null,
): Promise<WithAuthor<T>> {
  const [hydrated] = await attachAuthors([row], idOf)
  return hydrated ?? { ...row, author: null }
}
