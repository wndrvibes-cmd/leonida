import type { Database } from './database'

/**
 * Alias pratiques au-dessus des types generes par Supabase.
 * `database.ts` est genere automatiquement : ne jamais l'editer a la main,
 * tout raccourci applicatif se declare ici.
 */

export type { Database, Json } from './database'

/* ---------- Helpers generiques ---------- */

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

/* ---------- Lignes de tables ---------- */

export type Profile = Tables<'profiles'>
export type UserRole = Tables<'user_roles'>
export type Subscription = Tables<'subscriptions'>
export type UserSettings = Tables<'user_settings'>

export type NewsArticle = Tables<'news_articles'>
export type NewsCategory = Tables<'news_categories'>
export type NewsMedia = Tables<'news_media'>

export type Post = Tables<'posts'>
export type PostMedia = Tables<'post_media'>

/** Attention : masque le type DOM global `Comment` dans les fichiers qui l'importent. */
export type Comment = Tables<'comments'>
export type Reaction = Tables<'reactions'>
export type Favorite = Tables<'favorites'>
export type Report = Tables<'reports'>
export type Notification = Tables<'notifications'>

export type MapMarker = Tables<'map_markers'>
export type MapCategory = Tables<'map_categories'>

export type Contest = Tables<'contests'>

export type RadarRun = Tables<'radar_runs'>
export type RadarFinding = Tables<'radar_findings'>

export type AiConversation = Tables<'ai_conversations'>
export type AiMessage = Tables<'ai_messages'>
export type AiUsage = Tables<'ai_usage'>

export type MediaAsset = Tables<'media_assets'>
export type AppSetting = Tables<'app_settings'>
export type AuditLogEntry = Tables<'audit_log'>

/* ---------- Enums applicatifs ---------- */

export type AppRole = Enums<'app_role'>
export type MarkerStatus = Enums<'marker_status'>
export type VerificationLevel = Enums<'verification_level'>
export type Reliability = Enums<'reliability'>
export type PostType = Enums<'post_type'>
export type PostSurface = Enums<'post_surface'>
export type TargetType = Enums<'target_type'>
export type ReactionType = Enums<'reaction_type'>
export type ContentStatus = Enums<'content_status'>
export type MediaKind = Enums<'media_kind'>
export type NotificationType = Enums<'notification_type'>
export type ReportReason = Enums<'report_reason'>
export type ReportStatus = Enums<'report_status'>
export type SubscriptionStatus = Enums<'subscription_status'>
export type RadarKind = Enums<'radar_kind'>
export type RadarStatus = Enums<'radar_status'>
export type FindingStatus = Enums<'finding_status'>
export type AiRole = Enums<'ai_role'>
