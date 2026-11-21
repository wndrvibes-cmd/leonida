import { Suspense, useEffect, useId, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { RouteFallback } from '@/app/RouteFallback'
import { Logo } from '@/components/layout/Logo'
import { UserMenu } from '@/components/layout/UserMenu'
import { Icon } from '@/components/ui'
import s from './AdminLayout.module.css'

interface AdminSection {
  to: string
  label: string
  /** Correspondance exacte, reservee au tableau de bord. */
  end?: boolean
}

/**
 * Sections de l'espace d'administration.
 * Les modules d'administration doivent fournir exactement ces chemins ;
 * cette liste est la source de verite de la navigation.
 */
export const ADMIN_SECTIONS: AdminSection[] = [
  { to: '/admin',               label: 'Tableau de bord', end: true },
  { to: '/admin/actualites',    label: 'Actualités' },
  { to: '/admin/communaute',    label: 'Communauté' },
  { to: '/admin/carte',         label: 'Carte' },
  { to: '/admin/cadeaux',       label: 'Cadeaux' },
  { to: '/admin/radar',         label: 'Radar' },
  { to: '/admin/signalements',  label: 'Signalements' },
  { to: '/admin/membres',       label: 'Membres' },
  { to: '/admin/medias',        label: 'Médias' },
  { to: '/admin/reglages',      label: 'Réglages' },
]

/** Section courante : le chemin connu le plus long qui prefixe l'URL. */
function currentLabel(pathname: string): string {
  let best = ADMIN_SECTIONS[0]
  for (const section of ADMIN_SECTIONS) {
    if (pathname === section.to || pathname.startsWith(`${section.to}/`)) {
      if (section.to.length >= best.to.length) best = section
    }
  }
  return best.label
}

/**
 * Coquille de l'administration : barre laterale sur grand ecran, menu
 * deroulant sur mobile. Toute la protection reelle est assuree par la RLS ;
 * cette mise en page suppose seulement que <RequireStaff> a laisse passer.
 */
export function AdminLayout() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const menuId = useId()

  useEffect(() => { setOpen(false) }, [pathname])

  const list = (
    <ul className={s.list}>
      {ADMIN_SECTIONS.map((section) => (
        <li key={section.to}>
          <NavLink
            to={section.to}
            end={section.end}
            className={({ isActive }) => (isActive ? `${s.link} ${s.active}` : s.link)}
          >
            {section.label}
          </NavLink>
        </li>
      ))}
    </ul>
  )

  return (
    <div className={s.shell}>
      <header className={s.header}>
        <div className={s.headerInner}>
          <Link to="/admin" className={s.brand} aria-label="LEONIDA — administration">
            <Logo variant="mark" size={26} label={null} />
            <span className={s.brandText}>Administration</span>
          </Link>

          <div className={s.headerActions}>
            <Link to="/" className={s.exit}>
              <Icon name="arrow-left" size={16} />
              <span className={s.exitText}>Retour au site</span>
            </Link>
            <UserMenu />
          </div>
        </div>

        {/* Menu deroulant mobile : la barre laterale est masquee sous 900px. */}
        <div className={s.mobileNav}>
          <button
            type="button"
            className={s.mobileTrigger}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={menuId}
          >
            <span>{currentLabel(pathname)}</span>
            <Icon
              name="chevron-down"
              size={18}
              className={open ? `${s.chevron} ${s.chevronOpen}` : s.chevron}
            />
          </button>
          <nav id={menuId} className={s.mobileMenu} hidden={!open} aria-label="Sections d'administration">
            {list}
          </nav>
        </div>
      </header>

      <div className={s.body}>
        <nav className={s.side} aria-label="Sections d'administration">{list}</nav>

        <main className={s.content}>
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
