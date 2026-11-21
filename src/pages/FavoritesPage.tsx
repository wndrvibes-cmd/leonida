import { FavoritesScreen } from '@/features/profile'

/**
 * Mes favoris — `/favoris`.
 *
 * Liste strictement privee (policy `favorites_own`) : elle n'apparait sur
 * aucun profil public.
 */
export default function FavoritesPage() {
  return <FavoritesScreen />
}
