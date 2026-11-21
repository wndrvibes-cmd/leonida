/**
 * Liens video acceptes par le composeur : YouTube et Twitch, rien d'autre.
 *
 * POURQUOI UNE LISTE FERMEE : la miniature et le libelle affiches doivent
 * etre DEDUITS du lien, pas inventes. Pour YouTube, l'identifiant de la video
 * donne une vraie vignette publique. Pour Twitch, aucune vignette n'est
 * accessible sans passer par l'API Helix (jeton serveur) : on affiche donc une
 * carte de lecture annoncee comme un lien sortant, jamais une fausse image.
 *
 * Aucune iframe n'est intégrée : on n'embarque pas un domaine tiers dans la
 * page, on annonce ou mene le lien et le membre decide.
 */

export type VideoProvider = 'youtube' | 'twitch'

export interface VideoLink {
  provider: VideoProvider
  /** Identifiant ou slug reconnu dans l'URL. */
  id: string
  /** URL nettoyee, celle qui sera reellement enregistree et ouverte. */
  canonicalUrl: string
  /** Vignette publique, `null` quand le fournisseur n'en expose pas. */
  thumbnailUrl: string | null
  /** Libelle affiche : « Video YouTube », « Clip Twitch »... */
  label: string
}

export const VIDEO_LINK_HINT =
  'Lien YouTube ou Twitch (vidéo, short, clip, rediffusion ou chaine). Le lien reste externe : rien n\'est intégré dans la page.'

export const VIDEO_LINK_ERROR =
  'Lien non reconnu. Seuls les liens YouTube et Twitch sont acceptés.'

const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be'])
const TWITCH_HOSTS = new Set(['twitch.tv', 'www.twitch.tv', 'm.twitch.tv', 'clips.twitch.tv'])

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/
const TWITCH_SLUG = /^[A-Za-z0-9_-]{2,100}$/

/** Les chemins reserves de twitch.tv ne designent pas une chaine. */
const TWITCH_RESERVED = new Set([
  'videos', 'directory', 'settings', 'subscriptions', 'wallet', 'downloads',
  'friends', 'inventory', 'drops', 'turbo', 'p', 'legal', 'jobs', 'store',
])

function toUrl(raw: string): URL | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    // Un membre colle souvent « youtu.be/... » sans protocole.
    return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
  } catch {
    return null
  }
}

function youtubeId(url: URL, segments: string[]): string | null {
  if (url.hostname.endsWith('youtu.be')) return segments[0] ?? null
  if (segments[0] === 'watch') return url.searchParams.get('v')
  if (segments[0] === 'shorts' || segments[0] === 'live' || segments[0] === 'embed') {
    return segments[1] ?? null
  }
  return null
}

function parseTwitch(url: URL, segments: string[]): VideoLink | null {
  const base = (id: string, label: string, path: string): VideoLink => ({
    provider: 'twitch',
    id,
    canonicalUrl: `https://www.twitch.tv/${path}`,
    thumbnailUrl: null,
    label,
  })

  if (url.hostname === 'clips.twitch.tv') {
    const slug = segments[0]
    if (!slug || !TWITCH_SLUG.test(slug)) return null
    return {
      provider: 'twitch',
      id: slug,
      canonicalUrl: `https://clips.twitch.tv/${slug}`,
      thumbnailUrl: null,
      label: 'Clip Twitch',
    }
  }

  if (segments[0] === 'videos') {
    const id = segments[1]
    if (!id || !/^\d{5,15}$/.test(id)) return null
    return base(id, 'Rediffusion Twitch', `videos/${id}`)
  }

  if (segments[1] === 'clip' && segments[2]) {
    const slug = segments[2]
    if (!TWITCH_SLUG.test(slug)) return null
    return base(slug, 'Clip Twitch', `${segments[0]}/clip/${slug}`)
  }

  const channel = segments[0]
  if (segments.length === 1 && channel && TWITCH_SLUG.test(channel) && !TWITCH_RESERVED.has(channel)) {
    return base(channel, `Chaine Twitch @${channel}`, channel)
  }

  return null
}

/** `null` quand le lien n'est ni YouTube ni Twitch, ou qu'il est incomplet. */
export function parseVideoLink(raw: string): VideoLink | null {
  const url = toUrl(raw)
  if (!url) return null

  const host = url.hostname.toLowerCase()
  const segments = url.pathname.split('/').filter(Boolean)

  if (YOUTUBE_HOSTS.has(host)) {
    const id = youtubeId(url, segments)
    if (!id || !YOUTUBE_ID.test(id)) return null
    return {
      provider: 'youtube',
      id,
      canonicalUrl: `https://www.youtube.com/watch?v=${id}`,
      // Vignette publique officielle, deduite de l'identifiant de la video.
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      label: 'Vidéo YouTube',
    }
  }

  if (TWITCH_HOSTS.has(host)) return parseTwitch(url, segments)

  return null
}

/** Nom d'hote lisible, pour annoncer ou mene un lien sortant inconnu. */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'un site externe'
  }
}
