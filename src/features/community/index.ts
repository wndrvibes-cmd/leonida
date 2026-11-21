/**
 * Module communautaire LEONIDA.
 *
 * Point d'entree unique : les pages `CommunityPage` et `PostPage` n'importent
 * que depuis ici.
 *
 *   import { useCommunityFeed, PostFeed } from '@/features/community'
 *
 * Rien n'est reecrit du socle : les briques d'engagement (`ReactionBar`,
 * `CommentThread`, `FavoriteButton`, `ShareButton`, `ReportButton`,
 * `AuthorLine`), les primitives d'interface et les services de donnees sont
 * reutilises tels quels.
 */

/* ----------------------------------------------------------------- filtres */
export {
  COMMUNITY_TABS, COMPOSER_TYPE_OPTIONS, DEFAULT_COMMUNITY_FILTERS, POST_TYPE_OPTIONS,
  TAB_HINTS, TAB_LABELS, asCommunityTab, asPostType, hasActiveCommunityFilters,
  isTypeLocked, readCommunityFilters, sortForTab, typeForTab, writeCommunityFilters,
} from './communityFilters'
export type { CommunityFilters, CommunityTab } from './communityFilters'

/* ----------------------------------------------------------------- requetes */
export { collectTags, fetchCommunityPage } from './communityQueries'
export type { CommunityQueryOptions } from './communityQueries'

/* -------------------------------------------------------------------- liens */
export { VIDEO_LINK_ERROR, VIDEO_LINK_HINT, hostOf, parseVideoLink } from './videoLink'
export type { VideoLink, VideoProvider } from './videoLink'

/* -------------------------------------------------------------------- hooks */
export {
  COMMUNITY_PAGE_SIZE, useCommunityFeed, useCreateCommunityPost, useDeleteCommunityPost,
  usePost, usePostQuickReaction, useUpdateCommunityPost,
} from './useCommunity'
export type {
  CreatedCommunityPost, EditedCommunityPost, NewCommunityPost, QuickReactionInput,
} from './useCommunity'

export { isDraftEmpty, useComposerDraft } from './useComposerDraft'
export type { ComposerDraft, ComposerDraftApi } from './useComposerDraft'

/* --------------------------------------------------------------- composants */
export { CommunityToolbar } from './CommunityToolbar'
export type { CommunityToolbarProps } from './CommunityToolbar'

export { DeletePostDialog } from './DeletePostDialog'
export type { DeletePostDialogProps } from './DeletePostDialog'

export { EmptyFeed } from './EmptyFeed'
export type { EmptyFeedProps } from './EmptyFeed'

export { PostCard, PostCardSkeleton } from './PostCard'
export type { PostCardProps } from './PostCard'

export { PostComposer } from './PostComposer'
export type { PostComposerProps } from './PostComposer'

export { PostDetail } from './PostDetail'
export type { PostDetailProps } from './PostDetail'

export { PostEditor } from './PostEditor'
export type { PostEditorProps } from './PostEditor'

export { PostFeed } from './PostFeed'
export type { PostFeedProps } from './PostFeed'

export { PostForm, BODY_MAX, EMPTY_POST_FORM, IMAGES_MAX, TAGS_MAX, TITLE_MAX } from './PostForm'
export type { PostFormProps, PostFormValues } from './PostForm'

export { PostGallery } from './PostGallery'
export type { PostGalleryProps } from './PostGallery'

export { PostMenu } from './PostMenu'
export type { PostMenuProps } from './PostMenu'

export { PostReactions } from './PostReactions'
export type { PostReactionsProps } from './PostReactions'
