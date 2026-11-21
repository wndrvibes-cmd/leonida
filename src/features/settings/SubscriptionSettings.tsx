import { Badge, Button, ErrorState, Icon, Skeleton, asBadgeTone } from '@/components/ui'
import { usePremiumConfig } from '@/hooks/useAppSettings'
import { formatDate, formatPrice } from '@/lib/format'
import { SettingsSection } from './SettingsSection'
import { SUBSCRIPTION_STATUS_LABELS, useMySubscription } from './useUserSettings'
import s from './SubscriptionSettings.module.css'

/**
 * Etat reel de l'abonnement LEONIDA+.
 *
 * Tout vient de la table `subscriptions`, qu'aucun utilisateur ne peut
 * ecrire : seule une Edge Function en `service_role` (le webhook Stripe) y
 * touche. Ce qui est affiche ici est donc l'etat serveur, pas une supposition
 * du navigateur.
 *
 * Tant que `premium.config.stripe_enabled` est faux, aucun paiement n'existe :
 * on le dit, on ne propose pas un bouton qui echouerait.
 */
export function SubscriptionSettings() {
  const { data: config } = usePremiumConfig()
  const { data: subscription, isLoading, isError, refetch } = useMySubscription()

  if (isLoading) {
    return (
      <SettingsSection title="Abonnement" icon="crown">
        <Skeleton height="1.2rem" width="40%" />
        <Skeleton height="1rem" width="70%" />
      </SettingsSection>
    )
  }

  if (isError) {
    return (
      <SettingsSection title="Abonnement" icon="crown">
        <ErrorState
          title="Statut indisponible"
          description="Votre abonnement n'a pas pu être chargé."
          onRetry={() => void refetch()}
        />
      </SettingsSection>
    )
  }

  const status = subscription ? SUBSCRIPTION_STATUS_LABELS[subscription.status] : null
  const renewal = subscription?.current_period_end

  return (
    <SettingsSection
      title="Abonnement"
      icon="crown"
      description="Votre statut LEONIDA+ et les informations qui s'y rattachent."
      footnote={
        config && !config.stripeEnabled
          ? "Les abonnements ne sont pas encore ouverts : aucun paiement n'est possible aujourd'hui, et aucun montant ne peut être prélevé."
          : config?.stripeMode === 'test'
            ? 'Paiements en mode test : aucune somme réelle ne circule.'
            : undefined
      }
    >
      {subscription && status ? (
        <div className={s.card}>
          <div className={s.statusRow}>
            <Badge tone={asBadgeTone(status.tone)} size="md">
              LEONIDA+ · {status.label}
            </Badge>
          </div>
          <p className={s.help}>{status.help}</p>

          <dl className={s.facts}>
            {renewal ? (
              <div className={s.fact}>
                <dt>
                  {subscription.cancel_at_period_end ? 'Accès jusqu’au' : 'Prochain renouvellement'}
                </dt>
                <dd>{formatDate(renewal)}</dd>
              </div>
            ) : null}
            <div className={s.fact}>
              <dt>Formule</dt>
              <dd>{subscription.plan_code}</dd>
            </div>
          </dl>

          {subscription.cancel_at_period_end ? (
            <p className={s.notice}>
              <Icon name="info" size={16} />
              <span>
                La résiliation est enregistrée. Vous gardez l'accès jusqu'à la fin de la
                période en cours.
              </span>
            </p>
          ) : null}
        </div>
      ) : (
        <div className={s.card}>
          <p className={s.none}>Vous n'avez pas d'abonnement LEONIDA+.</p>
          <p className={s.help}>
            La consultation des actualités, de la carte et des découvertes validées reste
            gratuite. LEONIDA+ ouvre la contribution de découvertes sur la carte.
          </p>
          {config && config.priceEur !== null ? (
            <div className={s.price}>
              <strong>{formatPrice(config.priceEur, config.currency)}</strong>
              <span>par mois — tarif prévu</span>
            </div>
          ) : null}
        </div>
      )}

      <div className={s.actions}>
        <Button as="link" to="/premium" variant="secondary" iconRight={<Icon name="arrow-right" size={16} />}>
          Voir l'offre LEONIDA+
        </Button>
      </div>
    </SettingsSection>
  )
}

export default SubscriptionSettings
