import { Route, Routes } from 'react-router-dom'
import PagePlaceholder from '@/components/shared/PagePlaceholder'
import { ADMIN_SECTIONS } from '@/layouts/AdminLayout'
import { AdminContributions } from '@/features/admin/AdminContributions'
import { AdminDashboard } from '@/features/admin/AdminDashboard'
import { AdminMembers } from '@/features/admin/AdminMembers'
import { AdminReports } from '@/features/admin/AdminReports'

/**
 * Routes de l'administration.
 *
 * Les ecrans construits sont declares explicitement ; les sections encore a
 * faire retombent sur un ecran d'attente genere depuis `ADMIN_SECTIONS`, pour
 * qu'aucun lien de la barre laterale ne mene a une page morte et que l'etat
 * reel de chaque section soit annonce sans ambiguite.
 */

/** Chemins relatifs deja implementes : ils ne recoivent pas d'ecran d'attente. */
const IMPLEMENTED = new Set(['', 'carte', 'signalements', 'membres'])

export default function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="carte" element={<AdminContributions />} />
      <Route path="signalements" element={<AdminReports />} />
      <Route path="membres" element={<AdminMembers />} />

      {ADMIN_SECTIONS.map((section) => {
        const relative = section.to === '/admin' ? '' : section.to.slice('/admin/'.length)
        if (IMPLEMENTED.has(relative)) return null

        return (
          <Route
            key={section.to}
            path={relative}
            element={
              <PagePlaceholder
                title={`${section.label} — administration`}
                description="Cet écran d'administration n'est pas encore construit. Les données existent en base : rien n'est perdu, il manque l'interface."
              />
            }
          />
        )
      })}

      <Route
        path="*"
        element={
          <PagePlaceholder
            title="Section inconnue"
            description="Cette adresse ne correspond à aucune section de l'administration."
          />
        }
      />
    </Routes>
  )
}
