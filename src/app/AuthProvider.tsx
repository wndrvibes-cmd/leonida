import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type Settings = Database['public']['Tables']['user_settings']['Row']
type AppRole = Database['public']['Enums']['app_role']

export interface AuthState {
  /** `undefined` tant que la session initiale n'est pas resolue. */
  session: Session | null | undefined
  user: User | null
  profile: Profile | null
  settings: Settings | null
  roles: AppRole[]
  isAdmin: boolean
  isStaff: boolean
  isPremium: boolean
  isSuspended: boolean
  loading: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

/**
 * Source de verite cote client pour l'identite du membre.
 *
 * IMPORTANT — ces valeurs servent uniquement a ADAPTER L'INTERFACE
 * (afficher un bouton, masquer un onglet). Elles ne protegent rien :
 * toute regle d'acces reelle est appliquee par la RLS PostgreSQL. Un
 * utilisateur qui forcerait `isAdmin` dans son navigateur n'obtiendrait
 * aucune donnee supplementaire.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [roles, setRoles] = useState<AppRole[]>([])
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)

  // Evite les courses entre deux chargements concurrents.
  const loadToken = useRef(0)

  const loadIdentity = useCallback(async (userId: string | undefined) => {
    const token = ++loadToken.current

    if (!userId) {
      setProfile(null); setSettings(null); setRoles([]); setIsPremium(false)
      setLoading(false)
      return
    }

    const [profileRes, settingsRes, rolesRes, premiumRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', userId),
      supabase.rpc('is_premium'),
    ])

    // Un chargement plus recent a pris la main : on abandonne celui-ci.
    if (token !== loadToken.current) return

    setProfile(profileRes.data ?? null)
    setSettings(settingsRes.data ?? null)
    setRoles((rolesRes.data ?? []).map((r) => r.role))
    setIsPremium(premiumRes.data === true)
    setLoading(false)
  }, [])

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      void loadIdentity(data.session?.user.id)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return
      setSession(next)

      // Un simple rafraichissement de jeton ne doit pas relancer les requetes.
      if (event === 'TOKEN_REFRESHED') return

      setLoading(true)
      void loadIdentity(next?.user.id)
    })

    return () => { active = false; sub.subscription.unsubscribe() }
  }, [loadIdentity])

  const refresh = useCallback(async () => {
    await loadIdentity(session?.user.id)
  }, [loadIdentity, session?.user.id])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null); setSettings(null); setRoles([]); setIsPremium(false)
  }, [])

  const value = useMemo<AuthState>(() => ({
    session,
    user: session?.user ?? null,
    profile,
    settings,
    roles,
    isAdmin: roles.includes('admin'),
    isStaff: roles.includes('admin') || roles.includes('moderator'),
    isPremium,
    isSuspended: profile?.is_suspended ?? false,
    loading: session === undefined || loading,
    refresh,
    signOut,
  }), [session, profile, settings, roles, isPremium, loading, refresh, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit etre utilise a l\'interieur de <AuthProvider>.')
  return ctx
}
