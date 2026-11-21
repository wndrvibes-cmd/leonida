import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { RequireAuth, RequireStaff } from '@/app/guards'
import { useMotionPreference } from '@/app/motionPreference'
import { RouteFallback } from '@/app/RouteFallback'
import AdminLayout from '@/layouts/AdminLayout'
import AppLayout from '@/layouts/AppLayout'
import AuthLayout from '@/layouts/AuthLayout'

/* =============================================================================
   Decoupage par route : chaque ecran est un module separe, charge a la demande.
   Les coquilles (AppLayout, AuthLayout, AdminLayout) restent dans le paquet
   principal pour que la navigation affiche immediatement la structure.

   Chaque page est importee par DEFAUT depuis '@/pages/<Nom>Page'.
   ========================================================================== */

const HomePage           = lazy(() => import('@/pages/HomePage'))
const NewsPage           = lazy(() => import('@/pages/NewsPage'))
const NewsArticlePage    = lazy(() => import('@/pages/NewsArticlePage'))
const CommunityPage      = lazy(() => import('@/pages/CommunityPage'))
const PostPage           = lazy(() => import('@/pages/PostPage'))
const MomentsPage        = lazy(() => import('@/pages/MomentsPage'))
const MapPage            = lazy(() => import('@/pages/MapPage'))
const ContestsPage       = lazy(() => import('@/pages/ContestsPage'))
const ContestPage        = lazy(() => import('@/pages/ContestPage'))
const AiPage             = lazy(() => import('@/pages/AiPage'))
const PremiumPage        = lazy(() => import('@/pages/PremiumPage'))
const SearchPage         = lazy(() => import('@/pages/SearchPage'))
const FavoritesPage      = lazy(() => import('@/pages/FavoritesPage'))
const NotificationsPage  = lazy(() => import('@/pages/NotificationsPage'))
const ProfilePage        = lazy(() => import('@/pages/ProfilePage'))
const SettingsPage       = lazy(() => import('@/pages/SettingsPage'))
const NotFoundPage       = lazy(() => import('@/pages/NotFoundPage'))

const LoginPage          = lazy(() => import('@/pages/LoginPage'))
const RegisterPage       = lazy(() => import('@/pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'))
const ResetPasswordPage  = lazy(() => import('@/pages/ResetPasswordPage'))

/** Routes descendantes de l'administration, fournies par le module admin. */
const AdminRoutes        = lazy(() => import('@/pages/admin/AdminRoutes'))

export function AppRouter() {
  // Synchronise <html data-reduce-motion> avec le réglage du membre.
  useMotionPreference()

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* ------------------------------------------------ application ---- */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomePage />} />

          <Route path="actualites" element={<NewsPage />} />
          <Route path="actualites/:slug" element={<NewsArticlePage />} />

          <Route path="communaute" element={<CommunityPage />} />
          <Route path="communaute/:id" element={<PostPage />} />

          <Route path="moments" element={<MomentsPage />} />
          <Route path="carte" element={<MapPage />} />

          <Route path="cadeaux" element={<ContestsPage />} />
          <Route path="cadeaux/:slug" element={<ContestPage />} />

          <Route path="ia" element={<AiPage />} />
          <Route path="premium" element={<PremiumPage />} />
          <Route path="recherche" element={<SearchPage />} />

          {/* Profil public : consultable sans compte. */}
          <Route path="profil/:username" element={<ProfilePage />} />

          {/* Espaces personnels. Les gardes sont cosmetiques : la RLS protege. */}
          <Route path="favoris" element={<RequireAuth><FavoritesPage /></RequireAuth>} />
          <Route path="notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
          <Route path="parametres" element={<RequireAuth><SettingsPage /></RequireAuth>} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* -------------------------------------------- authentification --- */}
        <Route element={<AuthLayout />}>
          <Route path="connexion" element={<LoginPage />} />
          <Route path="inscription" element={<RegisterPage />} />
          <Route path="mot-de-passe-oublie" element={<ForgotPasswordPage />} />
          <Route path="reinitialiser" element={<ResetPasswordPage />} />
        </Route>

        {/* ------------------------------------------------ administration - */}
        <Route path="admin" element={<RequireStaff><AdminLayout /></RequireStaff>}>
          {/* Le module admin declare ses propres sous-routes (<Routes> imbriquees). */}
          <Route path="*" element={<AdminRoutes />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default AppRouter
