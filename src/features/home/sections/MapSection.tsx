import { Button, Icon, Skeleton } from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import { useMapConfigSetting } from '@/hooks/useAppSettings'
import { CoverArt } from '../CoverArt'
import { PitchCard } from '../PitchCard'
import { SectionBody, SectionShell } from '../SectionShell'

export interface MapSectionProps {
  title: string
}

/**
 * Invitation a explorer la carte.
 *
 * Le fond de carte est fourni par un administrateur (`map.config.image_url`).
 * Tant qu'aucune image n'est televersee, on le dit franchement au lieu
 * d'afficher un apercu casse ou une carte empruntee ailleurs. La mention
 * d'origine du visuel (`disclaimer`) est reprise telle quelle.
 */
export function MapSection({ title }: MapSectionProps) {
  const { isStaff } = useAuth()
  const config = useMapConfigSetting()
  const hasImage = Boolean(config.data?.imageUrl)

  return (
    <SectionShell
      icon="map"
      title={title}
      subtitle="Reperez les découvertes de la communauté sur le plan de Leonida."
      to="/carte"
      linkLabel="Ouvrir la carte"
    >
      <SectionBody
        isLoading={config.isPending}
        isError={config.isError}
        error={config.error}
        onRetry={() => void config.refetch()}
        isEmpty={false}
        skeleton={<Skeleton width="100%" height={220} radius="lg" />}
      >
        <PitchCard
          icon="compass"
          heading={
            hasImage
              ? 'La carte communautaire de Leonida'
              : 'La carte attend son fond de plan'
          }
          description={
            hasImage
              ? 'Filtrez par catégorie, ouvrez une découverte, proposez la votre : chaque contribution passe par la validation de l\'équipe.'
              : 'Aucune image de carte n\'a encore été téléversée. L\'écran de la carte reste accessible, mais il ne peut pas encore afficher de plan.'
          }
          note={config.data?.disclaimer ?? null}
          action={
            <>
              <Button
                as="link"
                to="/carte"
                variant={hasImage ? 'primary' : 'secondary'}
                iconRight={<Icon name="arrow-right" size={18} />}
              >
                Ouvrir la carte
              </Button>
              {!hasImage && isStaff ? (
                <Button
                  as="link"
                  to="/admin/reglages"
                  variant="ghost"
                  iconLeft={<Icon name="shield" size={16} />}
                >
                  Configurer la carte
                </Button>
              ) : null}
            </>
          }
          aside={
            hasImage ? (
              <CoverArt
                src={config.data?.imageUrl ?? null}
                alt="Apercu du fond de carte de Leonida"
                icon="map"
                ratio="wide"
                seed="map"
              />
            ) : null
          }
        />
      </SectionBody>
    </SectionShell>
  )
}
