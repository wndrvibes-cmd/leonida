/**
 * Cles de cache TanStack Query, centralisees pour que l'invalidation
 * apres une mutation reste fiable et previsible.
 */
export const qk = {
  session:        ['session'] as const,
  profile:        (id: string) => ['profile', id] as const,
  profileByName:  (username: string) => ['profile', 'username', username] as const,
  roles:          (id: string) => ['roles', id] as const,
  premium:        (id: string) => ['premium', id] as const,
  settings:       (id: string) => ['settings', id] as const,

  appSettings:    (key?: string) =>
    (key ? (['appSettings', key] as const) : (['appSettings'] as const)),

  news:           (filters?: unknown) => ['news', filters ?? {}] as const,
  newsArticle:    (slug: string) => ['news', 'article', slug] as const,
  newsCategories: ['news', 'categories'] as const,

  posts:          (filters?: unknown) => ['posts', filters ?? {}] as const,
  post:           (id: string) => ['post', id] as const,

  comments:       (t: string, id: string) => ['comments', t, id] as const,
  reactions:      (t: string, id: string) => ['reactions', t, id] as const,

  mapConfig:      ['map', 'config'] as const,
  mapCategories:  ['map', 'categories'] as const,
  mapMarkers:     (filters?: unknown) => ['map', 'markers', filters ?? {}] as const,
  mapMarker:      (id: string) => ['map', 'marker', id] as const,
  myMarkers:      ['map', 'markers', 'mine'] as const,

  contests:       (filters?: unknown) => ['contests', filters ?? {}] as const,
  contest:        (slug: string) => ['contest', slug] as const,

  favorites:      (type?: string) => ['favorites', type ?? 'all'] as const,
  notifications:  ['notifications'] as const,
  unreadCount:    ['notifications', 'unread'] as const,

  search:         (q: string) => ['search', q] as const,

  aiConversations: ['ai', 'conversations'] as const,
  aiMessages:      (id: string) => ['ai', 'messages', id] as const,
  aiUsage:         ['ai', 'usage'] as const,

  admin: {
    stats:        ['admin', 'stats'] as const,
    members:      (f?: unknown) => ['admin', 'members', f ?? {}] as const,
    pendingMarkers: ['admin', 'markers', 'pending'] as const,
    reports:      (f?: unknown) => ['admin', 'reports', f ?? {}] as const,
    media:        (folder?: string) => ['admin', 'media', folder ?? 'all'] as const,
    radarRuns:    ['admin', 'radar', 'runs'] as const,
    radarFindings:(f?: unknown) => ['admin', 'radar', 'findings', f ?? {}] as const,
    subscriptions:['admin', 'subscriptions'] as const,
  },
} as const
