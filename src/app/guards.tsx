import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/app/AuthProvider'
import { RouteFallback } from '@/app/RouteFallback'
import s from './guards.module.css'

/**
 * GARDES DE ROUTE — PUREMENT COSMETIQUES.
 *
 * Elles evitent d'afficher un ecran vide a quelqu'un qui n'y a pas acces et
 * ramenent proprement vers la connexion. Elles ne protegent AUCUNE donnee :
 * la seule protection reelle est la RLS PostgreSQL. Un visiteur qui forcerait
 * `isAdmin` dans son navigateur verrait l'interface d'administration mais
 * obtiendrait zero ligne de la base.
 *
 * Pendant `auth.loading`, on affiche une attente : rediriger a ce moment
 * ejecterait un membre deja connecte dont la session n'est pas encore resolue.
 */

interface GuardProps { children: ReactNode }

/** Construit le lien de connexion en conservant la destination demandee. */
function useLoginRedirect(): { to: string; from: string } {
  const location = useLocation()
  const from = `${location.pathname}${location.search}`
  return { to: `/connexion?suite=${encodeURIComponent(from)}`, from }
}

export function RequireAuth({ children }: GuardProps) {
  const { session, loading } = useAuth()
  const { to, from } = useLoginRedirect()

  if (loading) return <RouteFallback label="Verification de votre session…" />

  // La destination voyage deux fois : dans l'URL (?suite=) et dans l'etat de
  // navigation (location.state.from). L'ecran de connexion peut lire l'un ou l'autre.
  if (!session) return <Navigate to={to} replace state={{ from }} />

  return <>{children}</>
}

export function RequireStaff({ children }: GuardProps) {
  const { session, isStaff, loading } = useAuth()
  const { to, from } = useLoginRedirect()

  if (loading) return <RouteFallback label="Verification de vos droits…" />
  if (!session) return <Navigate to={to} replace state={{ from }} />
  if (!isStaff) return <AccessDenied level="equipe" />

  return <>{children}</>
}

export function RequireAdmin({ children }: GuardProps) {
  const { session, isAdmin, loading } = useAuth()
  const { to, from } = useLoginRedirect()

  if (loading) return <RouteFallback label="Verification de vos droits…" />
  if (!session) return <Navigate to={to} replace state={{ from }} />
  if (!isAdmin) return <AccessDenied level="administration" />

  return <>{children}</>
}

/** Refus explique, jamais une redirection silencieuse qui laisse perplexe. */
function AccessDenied({ level }: { level: 'equipe' | 'administration' }) {
  return (
    <div className={s.denied} role="alert">
      <p className={s.kicker}>Acces restreint</p>
      <h1 className={s.title}>Cette page est reservee a l'{level} LEONIDA</h1>
      <p className={s.body}>
        Votre compte ne possede pas les droits necessaires. Si vous pensez qu'il
        s'agit d'une erreur, contactez un administrateur.
      </p>
      <Link className={s.link} to="/">Retour a l'accueil</Link>
    </div>
  )
}
