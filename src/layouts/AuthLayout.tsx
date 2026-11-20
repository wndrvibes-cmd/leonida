import { Suspense } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { RouteFallback } from '@/app/RouteFallback'
import { Logo } from '@/components/layout/Logo'
import { Icon } from '@/components/ui'
import s from './AuthLayout.module.css'

/**
 * Ecrans de compte (connexion, inscription, mot de passe).
 * Fond immersif : horizon tropical dessine en CSS, aucune image a charger.
 */
export function AuthLayout() {
  return (
    <div className={s.shell}>
      <div className={s.horizon} aria-hidden="true" />
      <div className={s.glow} aria-hidden="true" />

      <main className={s.panel}>
        <Link to="/" className={s.brand}>
          <Logo variant="full" size={30} label="LEONIDA — accueil" />
        </Link>

        <div className={s.card}>
          <Suspense fallback={<RouteFallback tone="inline" />}>
            <Outlet />
          </Suspense>
        </div>

        <Link to="/" className={s.back}>
          <Icon name="arrow-left" size={16} /> Retour au site
        </Link>
      </main>
    </div>
  )
}

export default AuthLayout
