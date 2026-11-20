import { useState, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, Icon, Skeleton, useToast,
} from '@/components/ui'
import { MARKER_STATUS_LABELS, VERIFICATION_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/format'
import { qk } from '@/lib/queryKeys'
import { readableError } from '@/lib/supabase'
import { deleteMyContribution, type MapCategory, type MapMarker } from '@/services/map'
import { CategoryChip } from './CategoryChip'
import { useMyContributions } from './useMapQueries'
import s from './MyContributions.module.css'

/**
 * Suivi personnel des contributions : statut reel, motif de refus, et
 * correction tant que la decouverte n'est pas validee.
 *
 * Rien n'est invente : la liste vient de `listMyContributions`, tous statuts
 * confondus, et la RLS garantit qu'un membre ne voit que les siennes.
 */

const STATUS_TONE = {
  draft:    'neutral',
  pending:  'warning',
  approved: 'success',
  rejected: 'danger',
} as const

export interface MyContributionsProps {
  userId: string | null
  categories: MapCategory[]
  /** Ouvre le formulaire de correction. */
  onEdit: (marker: MapMarker) => void
  /** Affiche la decouverte validee sur la carte. */
  onLocate: (marker: MapMarker) => void
  /** Bouton « Ajouter une decouverte », fourni par la page. */
  action?: ReactNode
}

export function MyContributions({ userId, categories, onEdit, onLocate, action }: MyContributionsProps) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [pendingDelete, setPendingDelete] = useState<MapMarker | null>(null)

  const { data, isPending, isError, error, refetch } = useMyContributions(userId)

  const removal = useMutation({
    mutationFn: (marker: MapMarker) => deleteMyContribution(marker.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.myMarkers })
      toast.success('Contribution supprimee')
      setPendingDelete(null)
    },
    onError: (err) => {
      toast.error('Suppression impossible', readableError(err))
      setPendingDelete(null)
    },
  })

  if (!userId) {
    return (
      <EmptyState
        title="Vos contributions, une fois connecte"
        description="Connectez-vous pour suivre les decouvertes que vous proposez et leur validation."
      />
    )
  }

  if (isPending) {
    return (
      <div className={s.list}>
        <Skeleton height={120} radius="lg" />
        <Skeleton height={120} radius="lg" />
      </div>
    )
  }

  if (isError) {
    return <ErrorState error={error} onRetry={() => { void refetch() }} />
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title="Aucune contribution pour l'instant"
        description="Proposez un lieu, un vehicule ou un secret : apres relecture de l'equipe, il rejoindra la carte avec votre nom d'auteur."
        action={action}
      />
    )
  }

  return (
    <>
      <ul className={s.list}>
        {data.map((marker) => {
          const category = categories.find((item) => item.id === marker.category_id) ?? null
          const editable = marker.status !== 'approved'
          const verification = VERIFICATION_LABELS[marker.verification]

          return (
            <Card key={marker.id} as="li" variant="flat" padding="md" className={s.item}>
              <div className={s.itemHead}>
                <h3 className={s.itemTitle}>{marker.title}</h3>
                <Badge tone={STATUS_TONE[marker.status]} dot>
                  {MARKER_STATUS_LABELS[marker.status]}
                </Badge>
              </div>

              <div className={s.itemMeta}>
                {category ? <CategoryChip category={category} /> : null}
                <span className={s.date}>Proposee le {formatDate(marker.created_at)}</span>
              </div>

              {marker.description ? <p className={s.excerpt}>{marker.description}</p> : null}

              {marker.status === 'rejected' && marker.rejection_reason ? (
                <p className={s.rejection}>
                  <Icon name="alert" size={16} />
                  <span>
                    <strong>Motif du refus :</strong> {marker.rejection_reason}
                  </span>
                </p>
              ) : null}

              {marker.status === 'pending' ? (
                <p className={s.hint}>
                  En attente de relecture. Elle n'apparait pas encore sur la carte publique.
                </p>
              ) : null}

              {marker.status === 'approved' ? (
                <p className={s.hint}>
                  Publiee sur la carte — niveau de verification : {verification.label.toLowerCase()}.
                  Une decouverte validee ne peut plus etre modifiee ; contactez l'equipe si une
                  correction est necessaire.
                </p>
              ) : null}

              <div className={s.itemActions}>
                {editable ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onEdit(marker)}
                    iconLeft={<Icon name="edit" size={16} />}
                  >
                    Corriger
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onLocate(marker)}
                    iconLeft={<Icon name="map" size={16} />}
                  >
                    Voir sur la carte
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPendingDelete(marker)}
                  iconLeft={<Icon name="trash" size={16} />}
                >
                  Supprimer
                </Button>
              </div>
            </Card>
          )
        })}
      </ul>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Supprimer cette contribution ?"
        message={
          pendingDelete
            ? `« ${pendingDelete.title} » sera definitivement supprimee. Cette action est irreversible.`
            : ''
        }
        confirmLabel="Supprimer"
        tone="danger"
        loading={removal.isPending}
        onConfirm={() => { if (pendingDelete) removal.mutate(pendingDelete) }}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}

export default MyContributions
