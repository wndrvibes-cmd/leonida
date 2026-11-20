import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '@/components/ui'

/**
 * Invitation a se connecter, partagee par toutes les actions d'engagement.
 *
 * Un visiteur non connecte qui clique sur « reagir », « favori » ou
 * « signaler » ne doit ni voir un bouton mort, ni recevoir une erreur brute :
 * on explique, et on propose un vrai chemin vers la connexion. La page
 * courante est transmise dans l'etat de navigation pour que `LoginPage` y
 * revienne une fois la session ouverte.
 */
export function useLoginPrompt(): (title: string, description?: string) => void {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  return useCallback(
    (title: string, description?: string) => {
      toast.toast({
        title,
        description,
        variant: 'info',
        action: {
          label: 'Se connecter',
          onClick: () => navigate('/connexion', { state: { from: location } }),
        },
      })
    },
    [navigate, location, toast],
  )
}
