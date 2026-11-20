import { NavLink } from 'react-router-dom'
import { Icon } from '@/components/ui'
import { PREMIUM_NAV, PRIMARY_NAV } from '@/components/layout/navItems'
import s from './DesktopNav.module.css'

/**
 * Navigation horizontale, visible a partir de 900px. En dessous, c'est la
 * barre d'onglets basse qui prend le relais (ce composant se masque seul).
 */
export function DesktopNav({ className }: { className?: string }) {
  return (
    <nav className={className ? `${s.nav} ${className}` : s.nav} aria-label="Navigation principale">
      <ul className={s.list}>
        {PRIMARY_NAV.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => (isActive ? `${s.link} ${s.active}` : s.link)}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
        <li>
          <NavLink
            to={PREMIUM_NAV.to}
            className={({ isActive }) => (isActive ? `${s.premium} ${s.active}` : s.premium)}
          >
            <Icon name={PREMIUM_NAV.icon} size={16} />
            {PREMIUM_NAV.label}
          </NavLink>
        </li>
      </ul>
    </nav>
  )
}

export default DesktopNav
