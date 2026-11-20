/**
 * Briques d'engagement LEONIDA.
 *
 * Toutes sont generiques sur le couple `(targetType, targetId)` : la meme
 * barre de reactions, le meme fil de commentaires et les memes boutons
 * servent une actualite, une publication, un moment, une decouverte de la
 * carte ou un concours.
 *
 *   import { ReactionBar, CommentThread, ShareButton } from '@/features/engagement'
 *
 * Aucune donnee n'est inventee ici : les compteurs viennent de la base, et un
 * contenu sans reaction ni commentaire l'affiche franchement.
 */

export { AuthorLine } from './AuthorLine'
export type { AuthorLineProps } from './AuthorLine'

export { CommentForm, COMMENT_MAX_LENGTH } from './CommentForm'
export type { CommentFormProps } from './CommentForm'

export { CommentRow } from './CommentRow'
export type { CommentRowProps } from './CommentRow'

export { CommentThread } from './CommentThread'
export type { CommentThreadProps } from './CommentThread'

export { FavoriteButton } from './FavoriteButton'
export type { FavoriteButtonProps } from './FavoriteButton'

export { ReactionBar } from './ReactionBar'
export type { ReactionBarProps } from './ReactionBar'

export { ReportButton, REPORT_DETAILS_MAX } from './ReportButton'
export type { ReportButtonProps } from './ReportButton'

export { ShareButton } from './ShareButton'
export type { ShareButtonProps } from './ShareButton'

export { useLoginPrompt } from './useLoginPrompt'

export type { EngagementSize, ReactionType, ReportReason, TargetType } from './types'
