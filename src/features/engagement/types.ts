import type { Database } from '@/types/database'

/**
 * Types partages par toutes les briques d'engagement.
 *
 * Les composants de ce dossier sont volontairement GENERIQUES sur le couple
 * `(targetType, targetId)` : la meme barre de reactions sert une actualite, une
 * publication, une decouverte de la carte, un commentaire ou un concours. Les
 * tables `reactions`, `favorites`, `comments` et `reports` partagent d'ailleurs
 * exactement cette paire de colonnes en base.
 */
export type TargetType = Database['public']['Enums']['target_type']
export type ReactionType = Database['public']['Enums']['reaction_type']
export type ReportReason = Database['public']['Enums']['report_reason']

/** Taille commune aux boutons d'action (favori, partage, signalement). */
export type EngagementSize = 'sm' | 'md'
