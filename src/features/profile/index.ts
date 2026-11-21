/**
 * Espace membre de LEONIDA : profil public, favoris, notifications.
 *
 *   import { ProfileScreen } from '@/features/profile'
 *
 * Les pages correspondantes (`src/pages/ProfilePage.tsx`,
 * `FavoritesPage.tsx`, `NotificationsPage.tsx`) ne sont que des coquilles :
 * toute la composition vit ici, et toutes les lectures passent par les hooks
 * du socle (`@/hooks/useProfile`, `useProfileStats`, `useFavorites`,
 * `useNotifications`) ou par `profileQueries.ts` pour les deux requetes « par
 * auteur » qui n'existaient pas encore cote services.
 */

export { default as ProfileScreen } from './ProfileScreen'
export type { ProfileScreenProps } from './ProfileScreen'

export { ProfileHeader } from './ProfileHeader'
export type { ProfileHeaderProps } from './ProfileHeader'

export { ProfileStatsRow } from './ProfileStatsRow'
export type { ProfileStatsRowProps } from './ProfileStatsRow'

export { ProfilePostList } from './ProfilePostList'
export type { ProfilePostListProps } from './ProfilePostList'

export { ProfileDiscoveries } from './ProfileDiscoveries'
export type { ProfileDiscoveriesProps } from './ProfileDiscoveries'

export { default as FavoritesScreen } from './FavoritesScreen'
export { default as NotificationsScreen } from './NotificationsScreen'

export { useAuthorMarkers, useAuthorPosts, useProfilePremium } from './profileQueries'
export type { AuthorPost, PremiumStatus } from './profileQueries'

export { notificationLink, useNotificationSlugs } from './notificationLinks'
export type { SlugIndex } from './notificationLinks'
