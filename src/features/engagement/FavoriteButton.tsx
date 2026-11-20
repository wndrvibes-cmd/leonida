import { Button, Icon, cx, useToast } from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import { useIsFavorite, useToggleFavorite } from '@/hooks/useFavorites'
import { readableError } from '@/lib/supabase'
import { useLoginPrompt } from './useLoginPrompt'
import type { EngagementSize, TargetType } from './types'
import s from './FavoriteButton.module.css'

export interface FavoriteButtonProps {
  targetType: TargetType
  targetId: string
  /** Affiche le libelle a cote de l'icone (page de detail). */
  withLabel?: boolean
  size?: EngagementSize
  className?: string
}

/**
 * Bascule de favori.
 *
 * Les favoris sont PRIVES (policy `favorites_own`) : ce bouton n'affiche aucun
 * compteur, et l'etat n'est charge que pour le membre connecte.
 */
export function FavoriteButton({
  targetType,
  targetId,
  withLabel = false,
  size = 'md',
  className,
}: FavoriteButtonProps) {
  const toast = useToast()
  const promptLogin = useLoginPrompt()
  const { user } = useAuth()

  const favorite = useIsFavorite(targetType, targetId)
  const toggle = useToggleFavorite(targetType, targetId)

  const confirmed = favorite.data ?? false
  // Affichage optimiste : pendant l'aller-retour on montre l'etat VISE. Le
  // hook, lui, n'ecrit que l'etat confirme par la base ; en cas d'echec
  // l'icone revient donc d'elle-meme a la verite du serveur.
  const active = toggle.isPending ? !confirmed : confirmed

  const label = active ? 'Retirer des favoris' : 'Ajouter aux favoris'

  function handleClick() {
    if (!user) {
      promptLogin('Connectez-vous pour enregistrer', 'Vos favoris restent prives.')
      return
    }

    toggle.mutate(undefined, {
      onError: (mutationError) => {
        toast.error('Favori impossible', readableError(mutationError))
      },
    })
  }

  return (
    <Button
      variant="ghost"
      size={size === 'sm' ? 'sm' : 'md'}
      iconOnly={!withLabel}
      onClick={handleClick}
      disabled={favorite.isLoading}
      aria-pressed={active}
      aria-label={withLabel ? undefined : label}
      title={label}
      className={cx(active && s.active, className)}
      iconLeft={withLabel ? <Icon name="bookmark" size={18} filled={active} /> : undefined}
    >
      {withLabel ? (
        active ? 'Enregistre' : 'Enregistrer'
      ) : (
        <Icon name="bookmark" size={18} filled={active} />
      )}
    </Button>
  )
}
