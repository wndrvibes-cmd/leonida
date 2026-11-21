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
  { value: 'fire',   emoji: '🔥', label: 'Énorme' },
  { value: 'love',   emoji: '❤️', label: "J'adore" },
  { value: 'wow',    emoji: '😮', label: 'Impressionnant' },
  { value: 'funny',  emoji: '😂', label: 'Drôle' },
  { value: 'useful', emoji: '💡', label: 'Utile' },
]

export const RELIABILITY_LABELS: Record<Enums['reliability'], { label: string; tone: string; help: string }> = {
  official:  { label: 'Officiel',     tone: 'success', help: 'Information publiée par Rockstar Games ou un canal officiel.' },
  reliable:  { label: 'Source fiable',tone: 'accent',  help: 'Publiée par une source reconnue et vérifiable.' },
  community: { label: 'Communauté',   tone: 'neutral', help: 'Information partagée par la communauté, non vérifiée officiellement.' },
  rumor:     { label: 'Rumeur',       tone: 'warning', help: 'Information non confirmée. À prendre avec précaution.' },
}

export const VERIFICATION_LABELS: Record<Enums['verification_level'], { label: string; tone: string; help: string }> = {
  unverified:          { label: 'Non vérifiée',       tone: 'neutral', help: "Découverte proposee, pas encore testee." },
  author_tested:       { label: "Testee par l'auteur", tone: 'accent', help: "L'auteur déclare avoir testé cette découverte lui-même." },
  community_confirmed: { label: 'Confirmée',          tone: 'success', help: 'Confirmée par plusieurs membres de la communauté.' },
  staff_verified:      { label: 'Vérifiée LEONIDA',   tone: 'premium', help: "Vérifiée par l'equipe LEONIDA." },
}

export const MARKER_STATUS_LABELS: Record<Enums['marker_status'], string> = {
  draft: 'Brouillon', pending: 'En attente', approved: 'Validée', rejected: 'Refusée',
}

export const REPORT_REASON_LABELS: Record<Enums['report_reason'], string> = {
  spam: 'Spam ou publicité',
  harassment: 'Harcèlement',
  hate: 'Propos haineux',
  nsfw: 'Contenu inapproprié',
  misinformation: 'Information trompeuse',
  off_topic: 'Hors sujet',
  stolen_content: 'Contenu volé',
  other: 'Autre',
}

export const CONTEST_CATEGORY_LABELS: Record<string, string> = {
  contest: 'Concours', gift: 'Cadeau', reward: 'Récompense',
  offer: 'Offre', event: 'Événement',
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
