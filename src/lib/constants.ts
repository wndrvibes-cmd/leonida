import type { Database } from '@/types/database'

type Enums = Database['public']['Enums']

/** Libelles francais des enums de la base. Source unique de verite cote UI. */

export const POST_TYPE_LABELS: Record<Enums['post_type'], string> = {
  discussion: 'Discussion',
  tip:        'Astuce',
  discovery:  'Découverte',
  vehicle:    'Véhicule',
  mission:    'Mission',
  secret:     'Secret',
  question:   'Question',
  screenshot: "Capture d'écran",
  video:      'Vidéo',
  other:      'Autre',
}

export const REACTIONS: { value: Enums['reaction_type']; emoji: string; label: string }[] = [
  { value: 'fire',   emoji: '🔥', label: 'Enorme' },
  { value: 'love',   emoji: '❤️', label: "J'adore" },
  { value: 'wow',    emoji: '😮', label: 'Impressionnant' },
  { value: 'funny',  emoji: '😂', label: 'Drole' },
  { value: 'useful', emoji: '💡', label: 'Utile' },
]

export const RELIABILITY_LABELS: Record<Enums['reliability'], { label: string; tone: string; help: string }> = {
  official:  { label: 'Officiel',     tone: 'success', help: 'Information publiee par Rockstar Games ou un canal officiel.' },
  reliable:  { label: 'Source fiable',tone: 'accent',  help: 'Publiee par une source reconnue et verifiable.' },
  community: { label: 'Communauté',   tone: 'neutral', help: 'Information partagee par la communaute, non verifiee officiellement.' },
  rumor:     { label: 'Rumeur',       tone: 'warning', help: 'Information non confirmee. A prendre avec precaution.' },
}

export const VERIFICATION_LABELS: Record<Enums['verification_level'], { label: string; tone: string; help: string }> = {
  unverified:          { label: 'Non vérifiée',       tone: 'neutral', help: "Découverte proposee, pas encore testee." },
  author_tested:       { label: "Testee par l'auteur", tone: 'accent', help: "L'auteur declare avoir teste cette decouverte lui-meme." },
  community_confirmed: { label: 'Confirmee',          tone: 'success', help: 'Confirmee par plusieurs membres de la communaute.' },
  staff_verified:      { label: 'Vérifiée LEONIDA',   tone: 'premium', help: "Vérifiée par l'equipe LEONIDA." },
}

export const MARKER_STATUS_LABELS: Record<Enums['marker_status'], string> = {
  draft: 'Brouillon', pending: 'En attente', approved: 'Validée', rejected: 'Refusee',
}

export const REPORT_REASON_LABELS: Record<Enums['report_reason'], string> = {
  spam: 'Spam ou publicite',
  harassment: 'Harcelement',
  hate: 'Propos haineux',
  nsfw: 'Contenu inapproprie',
  misinformation: 'Information trompeuse',
  off_topic: 'Hors sujet',
  stolen_content: 'Contenu vole',
  other: 'Autre',
}

export const CONTEST_CATEGORY_LABELS: Record<string, string> = {
  contest: 'Concours', gift: 'Cadeau', reward: 'Récompense',
  offer: 'Offre', event: 'Evenement',
}

/** Limites d'upload. Doivent rester alignees sur celles des buckets Supabase. */
export const UPLOAD_LIMITS = {
  avatars:       { maxBytes: 2  * 1024 * 1024, label: '2 Mo' },
  posts:         { maxBytes: 8  * 1024 * 1024, label: '8 Mo' },
  moments:       { maxBytes: 12 * 1024 * 1024, label: '12 Mo' },
  contributions: { maxBytes: 8  * 1024 * 1024, label: '8 Mo' },
  backgrounds:   { maxBytes: 8  * 1024 * 1024, label: '8 Mo' },
  news:          { maxBytes: 10 * 1024 * 1024, label: '10 Mo' },
  map:           { maxBytes: 25 * 1024 * 1024, label: '25 Mo' },
  contests:      { maxBytes: 10 * 1024 * 1024, label: '10 Mo' },
  banners:       { maxBytes: 12 * 1024 * 1024, label: '12 Mo' },
  media:         { maxBytes: 15 * 1024 * 1024, label: '15 Mo' },
} as const

export type BucketName = keyof typeof UPLOAD_LIMITS

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
export const ACCEPTED_IMAGE_ACCEPT = ACCEPTED_IMAGE_TYPES.join(',')
