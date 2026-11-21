import { Route, Routes } from 'react-router-dom'
import PagePlaceholder from '@/components/shared/PagePlaceholder'
import { ADMIN_SECTIONS } from '@/layouts/AdminLayout'

/**
 * Fichier d'attente des routes d'administration.
 *
 * Il declare une route par section de la barre laterale, afin qu'aucun lien
 * de navigation ne mene a une page morte. Le module d'administration
 * remplacera ce fichier par les ecrans reels, en conservant les memes chemins.
 */
export default function AdminRoutes() {
  return (
    <Routes>
      {ADMIN_SECTIONS.map((section) => {
        const relative = section.to === '/admin' ? null : section.to.slice('/admin/'.length)
        const element = (
          <PagePlaceholder
            title={`${section.label} — administration`}
            description="Cet écran d'administration n'est pas encore disponible."
          />
        )
        return relative === null
          ? <Route key={section.to} index element={element} />
          : <Route key={section.to} path={relative} element={element} />
      })}

      <Route
        path="*"
        element={
          <PagePlaceholder
            title="Section inconnue"
            description="Cette adresse ne correspond a aucune section de l'administration."
          />
        }
      />
    </Routes>
  )
}
