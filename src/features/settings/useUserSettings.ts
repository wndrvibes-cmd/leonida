import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { useAuth } from '@/app/AuthProvider'
import { qk } from '@/lib/queryKeys'
import { supabase } from '@/lib/supabase'
import { unwrapMaybe } from '@/services/query'
import type { Database } from '@/types/database'

/**
 * Ecriture des reglages du membre.
 *
 * `src/services/settings.ts` ne couvre que `app_settings` (les reglages de
 * l'application, reserves aux administrateurs). La table `user_settings`
 * n'avait pas encore d'acces dedie : il est ecrit ici, dans le module qui
 * l'utilise.
 *
 * SOURCE DE VERITE : la ligne chargee par `AuthProvider` (`useAuth().settings`).
 * C'est elle qui pilote `useAppBackground()` et `useMotionPreference()` ; apres
 * chaque ecriture on appelle donc `refresh()`, sans quoi le fond et la
 * preference de mouvement resteraient sur l'ancienne valeur.
 */

type SettingsRow = Database['public']['Tables']['user_settings']['Row']
type SettingsUpdate = Database['public']['Tables']['user_settings']['Update']
type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row']

/** Champs reellement modifiables par le membre depuis les parametres. */
export type UserSettingsPatch = Omit<
  SettingsUpdate,
  'user_id' | 'created_at' | 'updated_at'
>

export function useUpdateUserSettings() {
  const queryClient = useQueryClient()
  const { user, refresh } = useAuth()

  return useMutation({
    mutationFn: async (patch: UserSettingsPatch): Promise<SettingsRow> => {
      if (!user) throw new Error('Vous devez etre connecte pour modifier vos reglages.')

      // `upsert` et non `update` : la ligne est normalement creee par le
      // declencheur `handle_new_user`, mais un compte dont la ligne manque ne
      // doit pas se retrouver avec des reglages impossibles a enregistrer.
      const row = unwrapMaybe(
        await supabase
          .from('user_settings')
          .upsert({ user_id: user.id, ...patch }, { onConflict: 'user_id' })
          .select('*')
          .maybeSingle(),
      )

      if (!row) {
        throw new Error("Les reglages n'ont pas pu etre enregistres : droits insuffisants.")
      }
      return row
    },
    onSuccess: async (row) => {
      queryClient.setQueryData(qk.settings(row.user_id), row)
      await refresh()
    },
  })
}

/**
 * Abonnement LEONIDA+ du membre connecte.
 *
 * `null` est un cas NORMAL : aucun abonnement n'a jamais ete ouvert. La
 * policy `subscriptions_select` ne laisse lire que sa propre ligne.
 */
export function useMySubscription(): UseQueryResult<SubscriptionRow | null> {
  const { user } = useAuth()

  return useQuery({
    queryKey: [...qk.premium(user?.id ?? 'anonyme'), 'subscription'],
    queryFn: async (): Promise<SubscriptionRow | null> =>
      unwrapMaybe(
        await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user?.id as string)
          .maybeSingle(),
      ),
    enabled: Boolean(user),
    staleTime: 60 * 1000,
  })
}

/** Libelles francais des statuts d'abonnement Stripe. */
export const SUBSCRIPTION_STATUS_LABELS: Record<
  Database['public']['Enums']['subscription_status'],
  { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral'; help: string }
> = {
  active: { label: 'Actif', tone: 'success', help: 'Votre abonnement est en cours.' },
  trialing: { label: "Periode d'essai", tone: 'success', help: "Vous etes en periode d'essai." },
  past_due: {
    label: 'Paiement en retard',
    tone: 'warning',
    help: 'Le dernier paiement a echoue. Votre acces peut etre interrompu.',
  },
  canceled: { label: 'Resilie', tone: 'neutral', help: 'Cet abonnement est termine.' },
  incomplete: {
    label: 'Incomplet',
    tone: 'warning',
    help: "La mise en place de l'abonnement n'a pas abouti.",
  },
  unpaid: { label: 'Impaye', tone: 'danger', help: 'Une facture reste impayee.' },
  paused: { label: 'En pause', tone: 'neutral', help: 'Cet abonnement est suspendu.' },
}
