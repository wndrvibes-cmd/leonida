import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/app/AuthProvider'
import { useReduceMotion } from '@/app/motionPreference'
import { Icon, type IconName } from '@/components/ui'
import s from './TabBar.module.css'

interface Tab {
  to: string
  label: string
  icon: IconName
  /** `end` limite la correspondance au chemin exact (utile pour l'accueil). */
  end?: boolean
}

/**
 * Barre d'onglets basse, pour les ecrans de moins de 900px.
 * Cinq destinations maximum : au-dela, les cibles tactiles deviennent trop
 * etroites sur un iPhone.
 */
export function TabBar() {
  const { session, profile } = useAuth()
  const reduceMotion = useReduceMotion()

  // Sans compte, l'onglet profil mene a la connexion : pas de cul-de-sac.
  const profileTo = profile?.username
    ? `/profil/${profile.username}`
    : session ? '/parametres' : '/connexion'

  const tabs: Tab[] = [
    { to: '/',           label: 'Accueil',    icon: 'home', end: true },
    { to: '/actualites', label: 'Actus',      icon: 'news' },
    { to: '/carte',      label: 'Carte',      icon: 'map' },
    { to: '/communaute', label: 'Communaute', icon: 'community' },
    { to: profileTo,     label: 'Profil',     icon: 'user' },
  ]

  return (
    <nav className={s.bar} aria-label="Navigation principale">
      <ul className={s.list}>
        {tabs.map((tab) => (
          <li key={tab.label} className={s.item}>
            <NavLink
              to={tab.to}
              end={tab.end}
              className={({ isActive }) => (isActive ? `${s.tab} ${s.active}` : s.tab)}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      className={s.indicator}
                      layoutId="tabbar-indicator"
                      aria-hidden="true"
                      transition={reduceMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 460, damping: 36 }}
                    />
                  )}
                  <Icon name={tab.icon} size={22} className={s.icon} />
                  <span className={s.label}>{tab.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default TabBar
