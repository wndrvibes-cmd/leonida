import { Badge, Button, Icon, Skeleton } from '@/components/ui'
import { usePremiumConfig } from '@/hooks/useAppSettings'
import { formatPrice } from '@/lib/format'
import { PitchCard } from '../PitchCard'
import { SectionBody, SectionShell } from '../SectionShell'
import s from './PremiumSection.module.css'

export interface PremiumSectionProps {
  title: string
}

const INTERVAL_LABELS: Record<string, string> = {
  month: 'par mois',
  year: 'par an',
}

/**
 * LEONIDA+.
 *
 * Les avantages affiches sont EXACTEMENT ceux du reglage `premium.config` :
 * rien n'est ajoute cote interface. Tant que `stripe_enabled` est faux, aucun
 * parcours de paiement n'est propose — seul le lien vers la page de l'offre
 * reste actif, puisque cette page existe reellement.
 */
export function PremiumSection({ title }: PremiumSectionProps) {
  const premium = usePremiumConfig()
  const config = premium.data

  const price =
    config && config.priceEur !== null
      ? formatPrice(config.priceEur, config.currency)
      : null
  const interval = config ? INTERVAL_LABELS[config.interval] ?? null : null

  return (
    <SectionShell
      icon="crown"
      title={title}
      subtitle="Soutenir Leonida et debloquer les outils de contribution."
      to="/premium"
      linkLabel="Voir l'offre"
    >
      <SectionBody
        isLoading={premium.isPending}
        isError={premium.isError}
        error={premium.error}
        onRetry={() => void premium.refetch()}
        isEmpty={false}
        skeleton={<Skeleton width="100%" height={220} radius="lg" />}
      >
        <PitchCard
          icon="crown"
          heading="LEONIDA+"
          description="Un abonnement pour soutenir le projet et participer a la carte communautaire."
          bullets={config?.benefits ?? []}
          note={
            config && !config.stripeEnabled
              ? "Les abonnements ne sont pas encore ouverts : aucun paiement n'est possible aujourd'hui."
              : null
          }
          action={
            <Button
              as="link"
              to="/premium"
              variant="premium"
              iconRight={<Icon name="arrow-right" size={18} />}
            >
              Decouvrir LEONIDA+
            </Button>
          }
          aside={
            price ? (
              <div className={s.price}>
                <Badge tone="premium" size="sm" icon={<Icon name="crown" size={13} />}>
                  Tarif prevu
                </Badge>
                <p className={s.amount}>
                  {price}
                  {interval ? <span className={s.interval}>{interval}</span> : null}
                </p>
                <p className={s.hint}>
                  Tarif annonce par l'équipe. Il ne sera preleve qu'a l'ouverture des
                  abonnements.
                </p>
              </div>
            ) : null
          }
        />
      </SectionBody>
    </SectionShell>
  )
}
