import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button, Card, ErrorState, Icon, Skeleton, type IconName } from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import { getDashboardStats, type DashboardStats } from '@/services/admin'
import { qk } from '@/lib/queryKeys'
import { formatCount } from '@/lib/format'
import s from './AdminDashboard.module.css'

interface Metric {
  key: keyof DashboardStats
  label: string
  icon: IconName
  to?: string
  /** Une file d'attente : mise en avant des qu'elle n'est pas vide. */
  queue?: boolean
}

const METRICS: Metric[] = [
  { key: 'pendingMarkers', label: 'Contributions à valider', icon: 'pin',       to: '/admin/carte',        queue: true },
  { key: 'openReports',    label: 'Signalements ouverts',    icon: 'flag',      to: '/admin/signalements', queue: true },
  { key: 'members',        label: 'Membres',                 icon: 'users',     to: '/admin/membres' },
  { key: 'premium',        label: 'Abonnés LEONIDA+',        icon: 'crown' },
  { key: 'posts',          label: 'Publications',            icon: 'community', to: '/admin/communaute' },
  { key: 'moments',        label: 'Moments',                 icon: 'moments',   to: '/admin/communaute' },
  { key: 'publishedNews',  label: 'Actualités publiées',     icon: 'news',      to: '/admin/actualites' },
  { key: 'activeContests', label: 'Concours actifs',         icon: 'gift',      to: '/admin/cadeaux' },
]

/**
 * Tableau de bord.
 *
 * Chaque chiffre vient d'un `count: 'exact'` sur la base — aucun n'est estime
 * ni ecrit en dur. `premium` vaut `null` pour un moderateur : la RLS lui ferme
 * la table `subscriptions`, et afficher « 0 » serait un chiffre FAUX. On
 * affiche alors « — » et on explique pourquoi.
 */
export function AdminDashboard() {
  const { isAdmin } = useAuth()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...qk.admin.stats, { premium: isAdmin }],
    queryFn: () => getDashboardStats({ includePremium: isAdmin }),
    staleTime: 30_000,
  })

  return (
    <div className={s.screen}>
      <header className={s.head}>
        <h1 className={s.title}>Tableau de bord</h1>
        <p className={s.subtitle}>
          L'état réel de LEONIDA. Chaque chiffre est compté dans la base au moment du
          chargement.
        </p>
      </header>

      {isError ? (
        <ErrorState
          error={error}
          title="Statistiques indisponibles"
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          <div className={s.grid}>
            {METRICS.map((metric) => {
              const value = data?.[metric.key] ?? null
              const isQueue = Boolean(metric.queue) && typeof value === 'number' && value > 0

              const body = (
                <Card
                  variant={isQueue ? 'raised' : 'flat'}
                  padding="md"
                  className={isQueue ? `${s.metric} ${s.urgent}` : s.metric}
                >
                  <span className={s.metricIcon}>
                    <Icon name={metric.icon} size={18} />
                  </span>

                  <span className={s.metricValue}>
                    {isLoading ? (
                      <Skeleton width="3ch" height="1.6rem" />
                    ) : value === null ? (
                      <span className={s.unavailable} title="Réservé aux administrateurs">
                        —
                      </span>
                    ) : (
                      formatCount(value)
                    )}
                  </span>

                  <span className={s.metricLabel}>{metric.label}</span>

                  {metric.key === 'premium' && data?.premium === null ? (
                    <span className={s.metricNote}>
                      Réservé aux administrateurs
                    </span>
                  ) : null}
                </Card>
              )

              return metric.to ? (
                <Link key={metric.key} to={metric.to} className={s.cardLink}>
                  {body}
                </Link>
              ) : (
                <div key={metric.key}>{body}</div>
              )
            })}
          </div>

          <section className={s.queues}>
            <h2 className={s.sectionTitle}>À traiter</h2>
            <div className={s.queueRow}>
              <QueueCard
                icon="pin"
                label="Contributions carte en attente"
                count={data?.pendingMarkers}
                loading={isLoading}
                to="/admin/carte"
                emptyText="Aucune découverte en attente de validation."
                actionLabel="Ouvrir la file"
              />
              <QueueCard
                icon="flag"
                label="Signalements à examiner"
                count={data?.openReports}
                loading={isLoading}
                to="/admin/signalements"
                emptyText="Aucun contenu signalé."
                actionLabel="Voir les signalements"
              />
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function QueueCard({
  icon,
  label,
  count,
  loading,
  to,
  emptyText,
  actionLabel,
}: {
  icon: IconName
  label: string
  count: number | undefined
  loading: boolean
  to: string
  emptyText: string
  actionLabel: string
}) {
  const pending = (count ?? 0) > 0

  return (
    <Card variant="flat" padding="lg" className={s.queue}>
      <div className={s.queueHead}>
        <span className={pending ? `${s.queueIcon} ${s.queueIconActive}` : s.queueIcon}>
          <Icon name={icon} size={20} />
        </span>
        <div>
          <h3 className={s.queueTitle}>{label}</h3>
          <p className={s.queueText}>
            {loading ? 'Chargement…' : pending ? `${count} en attente` : emptyText}
          </p>
        </div>
      </div>

      <Button
        as="link"
        to={to}
        variant={pending ? 'primary' : 'secondary'}
        size="sm"
        iconRight={<Icon name="arrow-right" size={16} />}
      >
        {actionLabel}
      </Button>
    </Card>
  )
}

export default AdminDashboard
