import { Button, Icon, Skeleton } from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import { useAiConfig } from '@/hooks/useAppSettings'
import { PitchCard } from '../PitchCard'
import { SectionBody, SectionShell } from '../SectionShell'

export interface AiSectionProps {
  title: string
}

/**
 * LEONIDA AI.
 *
 * L'assistant est desactive tant qu'aucun fournisseur n'est configure cote
 * serveur (`ai.config.enabled`). Dans ce cas le bouton est DESACTIVE et la
 * raison est affichee : pas de faux parcours, pas de conversation simulee.
 */
export function AiSection({ title }: AiSectionProps) {
  const { isStaff } = useAuth()
  const ai = useAiConfig()
  const config = ai.data
  const enabled = config?.enabled ?? false

  const bullets = enabled && config
    ? [
        `${config.dailyMessagesFree} messages par jour avec un compte gratuit`,
        `${config.dailyMessagesPremium} messages par jour avec LEONIDA+`,
      ]
    : []

  return (
    <SectionShell
      icon="sparkles"
      title={title}
      subtitle="Un assistant dedie a l'univers de Leonida."
      to={enabled ? '/ia' : undefined}
      linkLabel="Ouvrir l'assistant"
    >
      <SectionBody
        isLoading={ai.isPending}
        isError={ai.isError}
        error={ai.error}
        onRetry={() => void ai.refetch()}
        isEmpty={false}
        skeleton={<Skeleton width="100%" height={200} radius="lg" />}
      >
        <PitchCard
          icon="sparkles"
          heading={enabled ? 'Posez vos questions a LEONIDA AI' : 'LEONIDA AI n\'est pas encore ouvert'}
          description={
            enabled
              ? 'L\'assistant repond sur les actualites, la carte et les decouvertes de la communaute.'
              : 'L\'assistant sera disponible des qu\'un fournisseur sera configure cote serveur. En attendant, rien n\'est simule : aucune reponse ne peut etre generee.'
          }
          bullets={bullets}
          note={config?.note ?? null}
          action={
            <>
              {enabled ? (
                <Button
                  as="link"
                  to="/ia"
                  variant="primary"
                  iconRight={<Icon name="arrow-right" size={18} />}
                >
                  Ouvrir l'assistant
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  disabled
                  iconLeft={<Icon name="lock" size={16} />}
                  title="Aucun fournisseur d'IA n'est configure."
                >
                  Assistant indisponible
                </Button>
              )}

              {!enabled && isStaff ? (
                <Button
                  as="link"
                  to="/admin/reglages"
                  variant="ghost"
                  iconLeft={<Icon name="shield" size={16} />}
                >
                  Configurer l'assistant
                </Button>
              ) : null}
            </>
          }
        />
      </SectionBody>
    </SectionShell>
  )
}
