import { useCallback, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import { qk } from '@/lib/queryKeys'
import { readableError } from '@/lib/supabase'
import { createContribution, updateMyContribution, type MapMarker } from '@/services/map'
import type { ContributionValues } from './ContributionForm'
import type { RelativePoint } from './types'

/**
 * Machine a etats de la contribution carte.
 *
 *   idle ──start──▶ gate        (visiteur, ou membre sans LEONIDA+)
 *        └─start──▶ placing ──tap──▶ form ──envoi──▶ sent
 *                     ▲                │
 *                     └── reposition ──┘
 *
 * RAPPEL DE SECURITE — `canContribute` ne protege RIEN. Le droit de
 * contribuer est applique par la RLS, et le declencheur
 * `tg_protect_marker_fields` force `status = 'pending'` cote base. Ce drapeau
 * sert uniquement a guider : montrer la bonne explication plutot qu'une
 * erreur brute apres un formulaire rempli pour rien.
 */

export type ContributeStep = 'idle' | 'gate' | 'placing' | 'form' | 'sent'

export interface ContributeFlow {
  step: ContributeStep
  point: RelativePoint | null
  /** Contribution en cours de correction ; `null` pour un nouveau depot. */
  editing: MapMarker | null
  /** Le membre est connecte ET abonne : l'interface peut ouvrir le flux. */
  canContribute: boolean
  isAuthenticated: boolean
  start: () => void
  startEdit: (marker: MapMarker) => void
  place: (point: RelativePoint) => void
  /** Depuis le formulaire : revenir deplacer le repere sur la carte. */
  reposition: () => void
  /** Valide la nouvelle position et revient au formulaire. */
  confirmPosition: () => void
  cancel: () => void
  submit: (values: ContributionValues) => void
  submitting: boolean
  error: unknown
}

export function useContributeFlow(): ContributeFlow {
  const { user, isPremium } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()

  const [step, setStep] = useState<ContributeStep>('idle')
  const [point, setPoint] = useState<RelativePoint | null>(null)
  const [editing, setEditing] = useState<MapMarker | null>(null)

  const isAuthenticated = Boolean(user)
  const canContribute = isAuthenticated && isPremium

  const mutation = useMutation({
    mutationFn: async (values: ContributionValues) => {
      if (!user) throw new Error('Connectez-vous pour proposer une decouverte.')
      if (!point) throw new Error('Placez le repere sur la carte avant d\'envoyer.')

      if (editing) {
        return updateMyContribution(editing.id, {
          title: values.title,
          categoryId: values.categoryId,
          description: values.description,
          instructions: values.instructions,
          imageUrl: values.imageUrl,
          estimatedReward: values.estimatedReward,
          authorTested: values.authorTested,
          x: point.x,
          y: point.y,
        })
      }

      return createContribution({
        authorId: user.id,
        title: values.title,
        categoryId: values.categoryId,
        description: values.description,
        instructions: values.instructions,
        imageUrl: values.imageUrl,
        estimatedReward: values.estimatedReward,
        authorTested: values.authorTested,
        x: point.x,
        y: point.y,
      })
    },
    onSuccess: (marker) => {
      void queryClient.invalidateQueries({ queryKey: qk.myMarkers })
      void queryClient.invalidateQueries({ queryKey: qk.mapMarker(marker.id) })
      toast.success(
        editing ? 'Correction enregistree' : 'Decouverte envoyee',
        'Elle passe en file de validation avant toute publication.',
      )
      setStep('sent')
    },
    onError: (err) => {
      toast.error("Envoi impossible", readableError(err))
    },
  })

  const { mutate, reset, isPending, error } = mutation

  const start = useCallback(() => {
    setEditing(null)
    setPoint(null)
    reset()
    setStep(canContribute ? 'placing' : 'gate')
  }, [canContribute, reset])

  const startEdit = useCallback((marker: MapMarker) => {
    setEditing(marker)
    setPoint({ x: marker.x, y: marker.y })
    reset()
    setStep('form')
  }, [reset])

  /**
   * Le tap POSE le repere sans quitter le mode placement : le membre peut
   * encore le faire glisser pour l'ajuster, puis valide lui-meme la position.
   */
  const place = useCallback((next: RelativePoint) => {
    setPoint(next)
  }, [])

  const reposition = useCallback(() => setStep('placing'), [])
  const confirmPosition = useCallback(() => setStep('form'), [])

  const cancel = useCallback(() => {
    setStep('idle')
    setPoint(null)
    setEditing(null)
    reset()
  }, [reset])

  return {
    step,
    point,
    editing,
    canContribute,
    isAuthenticated,
    start,
    startEdit,
    place,
    reposition,
    confirmPosition,
    cancel,
    submit: mutate,
    submitting: isPending,
    error,
  }
}
