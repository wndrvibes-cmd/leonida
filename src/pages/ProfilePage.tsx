import { useParams } from 'react-router-dom'
import { ProfileScreen } from '@/features/profile'

/**
 * Profil public d'un membre — `/profil/:username`.
 *
 * Consultable sans compte. La page est une coquille : toute la composition
 * vit dans `src/features/profile/`.
 */
export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()

  return <ProfileScreen username={username} />
}
