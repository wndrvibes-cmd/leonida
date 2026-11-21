import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Badge, Button, Card, EmptyState, ErrorState, Icon, Skeleton, Tabs, Textarea, useToast,
  type TabItem,
} from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import { listReports, resolveReport, type ReportEntry } from '@/services/admin'
import { REPORT_REASON_LABELS } from '@/lib/constants'
import { formatDate, relativeTime, truncate } from '@/lib/format'
import { readableError } from '@/lib/supabase'
import { qk } from '@/lib/queryKeys'
import type { Database } from '@/types/database'
import s from './AdminReports.module.css'

type ReportStatus = Database['public']['Enums']['report_status']
type TargetType = Database['public']['Enums']['target_type']

const STATUS_LABELS: Record<ReportStatus, { label: string; tone: 'warning' | 'accent' | 'success' | 'neutral' }> = {
  pending:   { label: 'À examiner', tone: 'warning' },
  reviewing: { label: 'En cours',   tone: 'accent' },
  resolved:  { label: 'Traité',     tone: 'success' },
  dismissed: { label: 'Écarté',     tone: 'neutral' },
}

const TARGET_LABELS: Record<TargetType, string> = {
  post: 'Publication',
  news: 'Actualité',
  marker: 'Découverte',
  comment: 'Commentaire',
  contest: 'Concours',
}

/**
 * Lien vers le contenu signalé, quand une route permet de l'atteindre
 * directement par son identifiant.
 *
 * `news` et `contest` s'adressent par leur `slug`, pas par leur `id` : on ne
 * fabrique donc PAS de lien qui menerait a une page introuvable.
 */
function targetLink(type: TargetType, id: string): string | null {
  if (type === 'post') return `/communaute/${id}`
  if (type === 'marker') return `/carte?marqueur=${id}`
  return null
}

export function AdminReports() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()

  const [status, setStatus] = useState<ReportStatus>('pending')
  const [noteFor, setNoteFor] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: qk.admin.reports({ status }),
    queryFn: () => listReports({ status, limit: 30 }),
    staleTime: 15_000,
  })

  const resolve = useMutation({
    mutationFn: ({ id, next }: { id: string; next: ReportStatus }) => {
      if (!user) throw new Error('Session expirée.')
      return resolveReport(id, { status: next, internalNote: note || null, resolverId: user.id })
    },
    onSuccess: () => {
      toast.success('Signalement mis à jour')
      setNoteFor(null)
      setNote('')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] })
      void queryClient.invalidateQueries({ queryKey: qk.admin.stats })
    },
    onError: (e) => toast.error(readableError(e)),
  })

  const tabs: TabItem[] = (Object.keys(STATUS_LABELS) as ReportStatus[]).map((key) => ({
    value: key,
    label: STATUS_LABELS[key].label,
  }))

  return (
    <div className={s.screen}>
      <header className={s.head}>
        <h1 className={s.title}>Signalements</h1>
        <p className={s.subtitle}>
          Les contenus signalés par les membres. Chaque décision est horodatée et
          attribuée à son modérateur.
        </p>
      </header>

      <div className="scroll-x">
        <Tabs
          items={tabs}
          value={status}
          onChange={(v) => setStatus(v as ReportStatus)}
          ariaLabel="Filtrer par statut"
        />
      </div>

      {isLoading ? (
        <>
          <Skeleton height="140px" radius="lg" />
          <Skeleton height="140px" radius="lg" />
        </>
      ) : isError ? (
        <ErrorState error={error} title="Signalements indisponibles" onRetry={() => void refetch()} />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState
          illustration={<Icon name="shield" size={28} />}
          title={status === 'pending' ? 'Aucun signalement à examiner' : 'Aucun signalement dans cet état'}
          description="Les contenus signalés par la communauté apparaîtront ici."
        />
      ) : (
        <ul className={s.list}>
          {data?.items.map((entry) => (
            <li key={entry.report.id}>
              <ReportCard
                entry={entry}
                busy={resolve.isPending}
                noteOpen={noteFor === entry.report.id}
                note={note}
                onNoteChange={setNote}
                onOpenNote={() => {
                  setNoteFor(entry.report.id)
                  setNote(entry.report.internal_note ?? '')
                }}
                onCloseNote={() => setNoteFor(null)}
                onDecide={(next) => resolve.mutate({ id: entry.report.id, next })}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ReportCard({
  entry, busy, noteOpen, note, onNoteChange, onOpenNote, onCloseNote, onDecide,
}: {
  entry: ReportEntry
  busy: boolean
  noteOpen: boolean
  note: string
  onNoteChange: (v: string) => void
  onOpenNote: () => void
  onCloseNote: () => void
  onDecide: (next: ReportStatus) => void
}) {
  const { report, reporterUsername } = entry
  const statusMeta = STATUS_LABELS[report.status]
  const link = targetLink(report.target_type, report.target_id)
  const closed = report.status === 'resolved' || report.status === 'dismissed'

  return (
    <Card variant="flat" padding="lg" className={s.card}>
      <div className={s.cardHead}>
        <div className={s.tags}>
          <Badge tone="danger" size="sm">{REPORT_REASON_LABELS[report.reason]}</Badge>
          <Badge tone="neutral" size="sm">{TARGET_LABELS[report.target_type]}</Badge>
          <Badge tone={statusMeta.tone} size="sm">{statusMeta.label}</Badge>
        </div>
        <span className={s.date} title={formatDate(report.created_at, true)}>
          {relativeTime(report.created_at)}
        </span>
      </div>

      <p className={s.reporter}>
        Signalé par{' '}
        {reporterUsername ? (
          <Link to={`/profil/${reporterUsername}`}>@{reporterUsername}</Link>
        ) : (
          <span className={s.gone}>un compte supprimé</span>
        )}
      </p>

      {report.details ? <p className={s.details}>« {truncate(report.details, 400)} »</p> : null}

      <div className={s.target}>
        {link ? (
          <Button as="link" to={link} variant="secondary" size="sm" iconRight={<Icon name="external" size={14} />}>
            Voir le contenu
          </Button>
        ) : (
          // Pas de lien fabrique : `news` et `contest` s'adressent par slug.
          <span className={s.ref}>
            Référence : {TARGET_LABELS[report.target_type]} <code>{report.target_id.slice(0, 8)}…</code>
          </span>
        )}
      </div>

      {report.internal_note && !noteOpen ? (
        <p className={s.note}>
          <Icon name="info" size={14} /> Note interne : {report.internal_note}
        </p>
      ) : null}

      {noteOpen ? (
        <div className={s.noteBox}>
          <Textarea
            label="Note interne"
            hint="Visible uniquement par l'équipe de modération."
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            rows={2}
            maxLength={500}
            autoFocus
          />
          <div className={s.actions}>
            <Button variant="ghost" size="sm" onClick={onCloseNote} disabled={busy}>Annuler</Button>
            <Button variant="primary" size="sm" loading={busy} onClick={() => onDecide('resolved')}>
              Enregistrer et traiter
            </Button>
          </div>
        </div>
      ) : (
        <div className={s.actions}>
          {!closed ? (
            <>
              {report.status === 'pending' ? (
                <Button variant="secondary" size="sm" disabled={busy} onClick={() => onDecide('reviewing')}>
                  Prendre en charge
                </Button>
              ) : null}
              <Button variant="primary" size="sm" disabled={busy} onClick={() => onDecide('resolved')}
                iconLeft={<Icon name="check" size={14} />}>
                Traiter
              </Button>
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => onDecide('dismissed')}>
                Écarter
              </Button>
            </>
          ) : (
            <span className={s.closedNote}>
              {report.resolved_at ? `Clos le ${formatDate(report.resolved_at)}` : 'Clos'}
            </span>
          )}
          <Button variant="ghost" size="sm" disabled={busy} onClick={onOpenNote}>
            {report.internal_note ? 'Modifier la note' : 'Ajouter une note'}
          </Button>
        </div>
      )}
    </Card>
  )
}

export default AdminReports
