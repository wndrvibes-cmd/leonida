import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Avatar, Badge, Button, Card, EmptyState, ErrorState, Icon, Skeleton, Textarea, useToast,
} from '@/components/ui'
import { listPendingMarkers, reviewMarker, setMarkerVerification } from '@/services/map'
import { useMapCategories } from '@/features/map/useMapQueries'
import { MARKER_STATUS_LABELS, VERIFICATION_LABELS } from '@/lib/constants'
import { relativeTime } from '@/lib/format'
import { readableError } from '@/lib/supabase'
import { qk } from '@/lib/queryKeys'
import type { MarkerListItem } from '@/services/map'
import s from './AdminContributions.module.css'

/**
 * File de validation des découvertes proposées par les membres LEONIDA+.
 *
 * Rien n'apparait sur la carte publique sans passer par ici : le declencheur
 * `tg_protect_marker_fields` force toute contribution de membre en `pending`
 * et interdit l'auto-validation, quelles que soient les valeurs envoyees.
 */
export function AdminContributions() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { data: categories } = useMapCategories()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: qk.admin.pendingMarkers,
    queryFn: () => listPendingMarkers(100),
    staleTime: 15_000,
  })

  const [rejecting, setRejecting] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: qk.admin.pendingMarkers })
    void queryClient.invalidateQueries({ queryKey: qk.admin.stats })
    void queryClient.invalidateQueries({ queryKey: ['map', 'markers'] })
  }

  const approve = useMutation({
    mutationFn: (id: string) => reviewMarker(id, 'approved'),
    onSuccess: () => {
      toast.success('Découverte publiée', "Elle apparait maintenant sur la carte. L'auteur est prévenu.")
      invalidate()
    },
    onError: (e) => toast.error(readableError(e)),
  })

  const reject = useMutation({
    mutationFn: ({ id, motif }: { id: string; motif: string }) =>
      reviewMarker(id, 'rejected', motif),
    onSuccess: () => {
      toast.success('Contribution refusée', "Le motif a été transmis a l'auteur.")
      setRejecting(null)
      setReason('')
      invalidate()
    },
    onError: (e) => toast.error(readableError(e)),
  })

  const certify = useMutation({
    mutationFn: (id: string) => setMarkerVerification(id, 'staff_verified'),
    onSuccess: () => {
      toast.success('Marquée « Vérifiée LEONIDA »')
      invalidate()
    },
    onError: (e) => toast.error(readableError(e)),
  })

  if (isLoading) {
    return (
      <div className={s.screen}>
        <Header count={null} />
        <Skeleton height="180px" radius="lg" />
        <Skeleton height="180px" radius="lg" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className={s.screen}>
        <Header count={null} />
        <ErrorState error={error} title="File indisponible" onRetry={() => void refetch()} />
      </div>
    )
  }

  const items = data ?? []

  return (
    <div className={s.screen}>
      <Header count={items.length} />

      {items.length === 0 ? (
        <EmptyState
          illustration={<Icon name="check" size={28} />}
          title="Aucune contribution en attente"
          description="Les découvertes proposées par les membres LEONIDA+ arriveront ici avant toute publication sur la carte."
        />
      ) : (
        <ul className={s.list}>
          {items.map((marker) => (
            <li key={marker.id}>
              <ContributionCard
                marker={marker}
                categoryLabel={
                  categories?.find((c) => c.id === marker.category_id)?.label ?? 'Sans catégorie'
                }
                busy={approve.isPending || reject.isPending || certify.isPending}
                rejecting={rejecting === marker.id}
                reason={reason}
                onReasonChange={setReason}
                onStartReject={() => {
                  setRejecting(marker.id)
                  setReason('')
                }}
                onCancelReject={() => setRejecting(null)}
                onApprove={() => approve.mutate(marker.id)}
                onConfirmReject={() => reject.mutate({ id: marker.id, motif: reason })}
                onCertify={() => certify.mutate(marker.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Header({ count }: { count: number | null }) {
  return (
    <header className={s.head}>
      <div>
        <h1 className={s.title}>Contributions carte</h1>
        <p className={s.subtitle}>
          Aucune découverte n'apparait sur la carte publique avant validation ici.
        </p>
      </div>
      {count !== null ? (
        <Badge tone={count > 0 ? 'warning' : 'success'} size="md">
          {count === 0 ? 'File vide' : `${count} en attente`}
        </Badge>
      ) : null}
    </header>
  )
}

interface CardProps {
  marker: MarkerListItem
  categoryLabel: string
  busy: boolean
  rejecting: boolean
  reason: string
  onReasonChange: (v: string) => void
  onStartReject: () => void
  onCancelReject: () => void
  onApprove: () => void
  onConfirmReject: () => void
  onCertify: () => void
}

function ContributionCard({
  marker, categoryLabel, busy, rejecting, reason,
  onReasonChange, onStartReject, onCancelReject, onApprove, onConfirmReject, onCertify,
}: CardProps) {
  const verification = VERIFICATION_LABELS[marker.verification]

  return (
    <Card variant="flat" padding="lg" className={s.card}>
      <div className={s.cardHead}>
        <div className={s.author}>
          <Avatar
            src={marker.author?.avatar_url ?? null}
            name={marker.author?.username ?? 'Inconnu'}
            size="sm"
          />
          <div className={s.authorText}>
            {marker.author ? (
              <Link to={`/profil/${marker.author.username}`} className={s.authorName}>
                @{marker.author.username}
              </Link>
            ) : (
              <span className={s.authorName}>Auteur supprimé</span>
            )}
            <span className={s.date}>{relativeTime(marker.created_at)}</span>
          </div>
        </div>

        <div className={s.tags}>
          <Badge tone="neutral" size="sm">{categoryLabel}</Badge>
          <Badge tone="warning" size="sm">{MARKER_STATUS_LABELS[marker.status]}</Badge>
        </div>
      </div>

      <h2 className={s.cardTitle}>{marker.title}</h2>

      {marker.description ? <p className={s.body}>{marker.description}</p> : null}

      {marker.instructions ? (
        <div className={s.block}>
          <h3 className={s.blockTitle}>Instructions</h3>
          <p className={s.body}>{marker.instructions}</p>
        </div>
      ) : null}

      <dl className={s.facts}>
        <div>
          <dt>Emplacement</dt>
          {/* Coordonnees relatives a l'image d'origine : elles restent justes
              quels que soient le zoom et la taille d'ecran. */}
          <dd>x {Number(marker.x).toFixed(4)} · y {Number(marker.y).toFixed(4)}</dd>
        </div>
        {marker.estimated_reward ? (
          <div>
            <dt>Récompense estimée</dt>
            <dd>{marker.estimated_reward}</dd>
          </div>
        ) : null}
        <div>
          <dt>Testée par l'auteur</dt>
          <dd>{marker.author_tested ? 'Oui, déclaré' : 'Non'}</dd>
        </div>
        <div>
          <dt>Vérification</dt>
          <dd>{verification.label}</dd>
        </div>
      </dl>

      {marker.image_url ? (
        <img className={s.image} src={marker.image_url} alt="" loading="lazy" decoding="async" />
      ) : null}

      {rejecting ? (
        <div className={s.rejectBox}>
          <Textarea
            label="Motif du refus"
            hint="Il est envoyé à l'auteur dans sa notification. Soyez précis : il pourra corriger."
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            maxLength={500}
            rows={3}
            autoFocus
          />
          <div className={s.actions}>
            <Button variant="ghost" onClick={onCancelReject} disabled={busy}>
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={onConfirmReject}
              loading={busy}
              disabled={reason.trim().length === 0}
            >
              Confirmer le refus
            </Button>
          </div>
        </div>
      ) : (
        <div className={s.actions}>
          <Button
            variant="primary"
            onClick={onApprove}
            loading={busy}
            iconLeft={<Icon name="check" size={16} />}
          >
            Valider et publier
          </Button>
          <Button variant="ghost" onClick={onStartReject} disabled={busy}>
            Refuser
          </Button>
          {/* « Vérifiée LEONIDA » n'est PAS automatique : elle atteste que
              l'equipe a reellement teste la decouverte. */}
          <Button
            variant="secondary"
            size="sm"
            onClick={onCertify}
            disabled={busy || marker.verification === 'staff_verified'}
            iconLeft={<Icon name="shield" size={16} />}
            title="À ne cocher que si l'équipe a réellement testé cette découverte."
          >
            Vérifiée LEONIDA
          </Button>
        </div>
      )}
    </Card>
  )
}

export default AdminContributions
