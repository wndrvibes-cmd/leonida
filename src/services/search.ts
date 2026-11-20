import { supabase } from '@/lib/supabase'
import { truncate } from '@/lib/format'
import type { Database } from '@/types/database'
import { fetchAuthorMap } from './authors'
import { ilikeValue, MIN_SEARCH_LENGTH, sanitizeSearch, unwrap } from './query'

type Reliability = Database['public']['Enums']['reliability']
type PostType = Database['public']['Enums']['post_type']
type PostSurface = Database['public']['Enums']['post_surface']
type VerificationLevel = Database['public']['Enums']['verification_level']

/**
 * Resultats NORMALISES pour l'affichage : la recherche globale alimente une
 * liste unifiee, elle n'a pas besoin des lignes completes. Chaque type reste
 * limite a dix resultats et les quatre requetes partent en parallele.
 */

export interface NewsHit {
  id: string
  slug: string
  title: string
  excerpt: string | null
  coverUrl: string | null
  /** A afficher systematiquement : une rumeur ne doit jamais passer pour un fait. */
  reliability: Reliability
  publishedAt: string | null
}

export interface PostHit {
  id: string
  title: string
  surface: PostSurface
  postType: PostType
  authorUsername: string | null
  createdAt: string
}

export interface MarkerHit {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  categoryId: string | null
  /** « Verifiee LEONIDA » uniquement si `staff_verified`. */
  verification: VerificationLevel
}

export interface ProfileHit {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
}

export interface SearchResults {
  /** Terme reellement utilise, apres nettoyage. */
  query: string
  /** `true` si le terme est trop court : aucune requete n'a ete envoyee. */
  tooShort: boolean
  news: NewsHit[]
  posts: PostHit[]
  markers: MarkerHit[]
  profiles: ProfileHit[]
  total: number
}

const PER_TYPE = 10

function emptyResults(query: string, tooShort: boolean): SearchResults {
  return { query, tooShort, news: [], posts: [], markers: [], profiles: [], total: 0 }
}

/**
 * Recherche globale.
 *
 * `ilike` plutot que la recherche plein texte : les index plein texte de la
 * base portent sur des EXPRESSIONS (`to_tsvector('french', title || excerpt)`)
 * que PostgREST ne sait pas cibler sans colonne generee ni fonction dediee.
 * `ilike` reste exact sur le resultat, et les volumes vises (dix lignes par
 * type) le rendent acceptable.
 */
export async function globalSearch(rawQuery: string): Promise<SearchResults> {
  const query = sanitizeSearch(rawQuery)
  if (query.length < MIN_SEARCH_LENGTH) return emptyResults(query, true)

  const value = ilikeValue(query)

  const [news, posts, markers, profiles] = await Promise.all([
    supabase
      .from('news_articles')
      .select('id,slug,title,excerpt,cover_url,reliability,published_at')
      .eq('status', 'published')
      .or(`title.ilike.${value},excerpt.ilike.${value}`)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(PER_TYPE),
    supabase
      .from('posts')
      .select('id,title,body,surface,post_type,author_id,created_at')
      .eq('is_hidden', false)
      .or(`title.ilike.${value},body.ilike.${value}`)
      .order('created_at', { ascending: false })
      .limit(PER_TYPE),
    supabase
      .from('map_markers')
      .select('id,title,description,image_url,category_id,verification')
      .eq('status', 'approved')
      .or(`title.ilike.${value},description.ilike.${value}`)
      .order('created_at', { ascending: false })
      .limit(PER_TYPE),
    supabase
      .from('profiles')
      .select('id,username,display_name,avatar_url')
      .or(`username.ilike.${value},display_name.ilike.${value}`)
      .order('created_at', { ascending: false })
      .limit(PER_TYPE),
  ])

  const postRows = unwrap(posts)
  const authors = await fetchAuthorMap(postRows.map((row) => row.author_id))

  const newsHits: NewsHit[] = unwrap(news).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverUrl: row.cover_url,
    reliability: row.reliability,
    publishedAt: row.published_at,
  }))

  const postHits: PostHit[] = postRows.map((row) => ({
    id: row.id,
    // Une publication peut n'avoir aucun titre : on resume alors son contenu.
    title: row.title?.trim() || truncate(row.body, 70) || 'Publication',
    surface: row.surface,
    postType: row.post_type,
    authorUsername: row.author_id ? authors.get(row.author_id)?.username ?? null : null,
    createdAt: row.created_at,
  }))

  const markerHits: MarkerHit[] = unwrap(markers).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    categoryId: row.category_id,
    verification: row.verification,
  }))

  const profileHits: ProfileHit[] = unwrap(profiles).map((row) => ({
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
  }))

  return {
    query,
    tooShort: false,
    news: newsHits,
    posts: postHits,
    markers: markerHits,
    profiles: profileHits,
    total: newsHits.length + postHits.length + markerHits.length + profileHits.length,
  }
}
