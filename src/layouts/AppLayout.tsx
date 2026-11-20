import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { RouteFallback } from '@/app/RouteFallback'
import { Intro } from '@/components/brand/Intro'
import { TabBar } from '@/components/layout/TabBar'
import { TopBar } from '@/components/layout/TopBar'
import s from './AppLayout.module.css'

/**
 * Coquille de l'application publique : barre du haut fixe, contenu, et barre
 * d'onglets basse sur mobile. Les reserves de place (hauteur des barres,
 * zones de securite iPhone) viennent de la classe globale `app-scroll-area`.
 */
export function AppLayout() {
  const { pathname, hash } = useLocation()

  // Chaque changement de page repart du haut — sauf si une ancre est visee.
  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname, hash])

  return (
    <div className={s.shell}>
      <a className="skip-link" href="#contenu">Aller au contenu</a>

      <TopBar />

      <main id="contenu" className={`${s.main} app-scroll-area`}>
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>

      <TabBar />

      {/* L'intro decide seule si elle doit se jouer (premier lancement). */}
      <Intro />
    </div>
  )
}

export default AppLayout
