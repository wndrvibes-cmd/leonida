import type { Database } from '@/types/database'

type ContentStatus = Database['public']['Enums']['content_status']

/**
 * Libelles des statuts d'article.
 *
 * `src/lib/constants.ts` (socle, gele) ne couvre pas `content_status`. Ces
 * libelles ne servent qu'a un cas : prevenir le staff qu'il lit un article
 * NON publie. Le fil public, lui, ne demande que `status = 'published'`.
 */
export const ARTICLE_STATUS_LABELS: Record<ContentStatus, string> = {
  draft: 'Brouillon',
  scheduled: 'Programme',
  published: 'Publie',
  archived: 'Archive',
}
