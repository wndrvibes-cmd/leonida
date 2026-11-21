import { useId, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button, Icon, Modal, Select, Spinner, Textarea, useToast, type SelectOption,
} from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import { REPORT_REASON_LABELS } from '@/lib/constants'
import { readableError } from '@/lib/supabase'
import { createReport, hasReported } from '@/services/reports'
import { useLoginPrompt } from './useLoginPrompt'
import type { EngagementSize, ReportReason, TargetType } from './types'
import s from './ReportButton.module.css'

/** Aligne sur la contrainte `length(details) <= 1000` de la table `reports`. */
export const REPORT_DETAILS_MAX = 1000

const REASON_OPTIONS: SelectOption[] = (
  Object.keys(REPORT_REASON_LABELS) as ReportReason[]
).map((value) => ({ value, label: REPORT_REASON_LABELS[value] }))

/**
 * Violation de la contrainte unique `(reporter_id, target_type, target_id)`.
 * Ce n'est pas un incident : le membre a deja signale ce contenu.
 */
function isDuplicate(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === '23505'
}

export interface ReportButtonProps {
  targetType: TargetType
  targetId: string
  withLabel?: boolean
  size?: EngagementSize
  className?: string
}

export function ReportButton({
  targetType,
  targetId,
  withLabel = false,
  size = 'md',
  className,
}: ReportButtonProps) {
  const toast = useToast()
  const promptLogin = useLoginPrompt()
  const { user, isSuspended } = useAuth()
  const queryClient = useQueryClient()
  const formId = useId()

  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [details, setDetails] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  // Cle locale : `qk` ne couvre que les signalements cote staff. On ne touche
  // pas a `src/lib/queryKeys.ts`, ce prefixe lui reste etranger.
  const reportedKey = ['reports', 'mine', targetType, targetId, user?.id ?? 'anonyme']

  const already = useQuery({
    queryKey: reportedKey,
    queryFn: () => hasReported(user?.id as string, targetType, targetId),
    enabled: open && Boolean(user),
    staleTime: 60 * 1000,
  })

  const submit = useMutation({
    mutationFn: () => {
      // Memes garde-fous que `useCreateComment` : on ne force aucun type, on
      // refuse l'appel. La RLS reste de toute facon la seule vraie barriere.
      if (!user) throw new Error('Vous devez être connecte pour signaler un contenu.')
      if (!reason) throw new Error('Choisissez un motif de signalement.')

      return createReport({
        reporterId: user.id,
        targetType,
        targetId,
        reason,
        details: details.trim() || null,
      })
    },
    onSuccess: () => {
      // Le contenu est desormais signale : si le membre rouvre le dialogue, il
      // doit le voir tout de suite plutot que de buter sur la contrainte unique.
      queryClient.setQueryData(reportedKey, true)
      toast.success('Signalement envoyé', "L'équipe de modération va l'examiner.")
      close()
    },
    onError: (mutationError) => {
      if (isDuplicate(mutationError)) {
        queryClient.setQueryData(reportedKey, true)
        setFormError('Vous avez déjà signale ce contenu.')
        return
      }
      setFormError(readableError(mutationError))
    },
  })

  function close() {
    setOpen(false)
    setReason('')
    setDetails('')
    setFormError(null)
  }

  function handleTrigger() {
    if (!user) {
      promptLogin('Connectez-vous pour signaler', 'Le signalement est réservé aux membres.')
      return
    }
    if (isSuspended) {
      toast.error(
        'Compte suspendu',
        'Vous ne pouvez pas deposer de signalement tant que votre compte est suspendu.',
      )
      return
    }
    setOpen(true)
  }

  const label = 'Signaler'
  const alreadyReported = already.data === true

  return (
    <>
      <Button
        variant="ghost"
        size={size === 'sm' ? 'sm' : 'md'}
        iconOnly={!withLabel}
        onClick={handleTrigger}
        aria-label={withLabel ? undefined : label}
        title={label}
        className={className}
        iconLeft={withLabel ? <Icon name="flag" size={18} /> : undefined}
      >
        {withLabel ? label : <Icon name="flag" size={18} />}
      </Button>

      <Modal
        open={open}
        onClose={close}
        title="Signaler ce contenu"
        description="Votre signalement est transmis a l'équipe de modération. Il reste confidentiel."
        size="sm"
        disableBackdropClose={submit.isPending}
        footer={
          alreadyReported ? (
            <Button variant="secondary" onClick={close} fullWidth>
              Fermer
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={close} disabled={submit.isPending}>
                Annuler
              </Button>
              <Button
                type="submit"
                form={formId}
                variant="danger"
                loading={submit.isPending}
                disabled={!reason || submit.isPending}
                iconLeft={<Icon name="flag" size={16} />}
              >
                Envoyer le signalement
              </Button>
            </>
          )
        }
      >
        {already.isLoading ? (
          <div className={s.center}>
            <Spinner label="Vérification en cours" />
          </div>
        ) : alreadyReported ? (
          <p className={s.note} role="status">
            <Icon name="check" size={18} className={s.noteIcon} />
            <span>
              Vous avez déjà signale ce contenu. Un seul signalement par membre est enregistré ; l'équipe de modération l'a bien recu.
            </span>
          </p>
        ) : (
          <form
            id={formId}
            className={s.form}
            onSubmit={(event) => {
              event.preventDefault()
              setFormError(null)
              submit.mutate()
            }}
            noValidate
          >
            {formError ? (
              <p className={s.alert} role="alert">
                <Icon name="alert" size={18} className={s.alertIcon} />
                <span>{formError}</span>
              </p>
            ) : null}

            <Select
              label="Motif"
              options={REASON_OPTIONS}
              placeholder="Choisir un motif"
              value={reason}
              onChange={(event) => setReason(event.target.value as ReportReason)}
              required
            />

            <Textarea
              label="Détails (facultatif)"
              hint="Précisez ce qui pose problème. Cela aide la modération a decider."
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              maxLength={REPORT_DETAILS_MAX}
              showCount
              rows={4}
            />
          </form>
        )}
      </Modal>
    </>
  )
}
