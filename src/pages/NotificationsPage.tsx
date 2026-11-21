import { NotificationsScreen } from '@/features/profile'

/**
 * Mes notifications — `/notifications`.
 *
 * Les notifications ne peuvent venir que des declencheurs de la base : la
 * table n'expose aucune policy INSERT, aucune n'est donc fabriquee ici.
 */
export default function NotificationsPage() {
  return <NotificationsScreen />
}
