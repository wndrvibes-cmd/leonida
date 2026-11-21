import type { IconName } from '@/components/ui'

export interface NavItem {
  to: string
  label: string
  icon: IconName
}

/** Navigation principale, partagee par le bureau et la barre d'onglets. */
export const PRIMARY_NAV: NavItem[] = [
  { to: '/',            label: 'Accueil',    icon: 'home' },
  { to: '/actualites',  label: 'Actualités', icon: 'news' },
  { to: '/communaute',  label: 'Communauté', icon: 'community' },
  { to: '/moments',     label: 'Moments',    icon: 'moments' },
  { to: '/carte',       label: 'Carte',      icon: 'map' },
  { to: '/cadeaux',     label: 'Cadeaux',    icon: 'gift' },
  { to: '/ia',          label: 'Assistant',  icon: 'sparkles' },
]

/** Mise en avant distincte : l'offre premium n'est pas une rubrique comme une autre. */
export const PREMIUM_NAV: NavItem = {
  to: '/premium', label: 'Premium', icon: 'crown',
}
