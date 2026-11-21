import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Avatar, Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, Icon, Input,
  Select, Skeleton, Switch, Textarea, useToast,
} from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import {
  listMembers, reinstateUser, setUserRole, suspendUser, type MemberEntry,
} from '@/services/admin'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDate } from '@/lib/format'
import { readableError } from '@/lib/supabase'
import { qk } from '@/lib/queryKeys'
import type { Database } from '@/types/database'
import s from './AdminMembers.module.css'

type AppRole = Database['public']['Enums']['app_role']

const ROLE_LABELS: Record<AppRole, string> = {
  member: 'Membre',
  moderator: 'Modérateur',
  admin: 'Administrateur',
}

/** Le role le plus eleve detenu : c'est lui qui compte pour l'affichage. */
function topRole(roles: AppRole[] | null): AppRole | null {
  if (!roles) return null
  if (roles.includes('admin')) return 'admin'
  if (roles.includes('moderator')) return 'moderator'
  return 'member'
}

export function AdminMembers() {
  const { isAdmin, user } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()

  const [search, setSearch] = useState('')
  const [onlySuspended, setOnlySuspended] = useState(false)
  const debounced = useDebounce(search, 300)

  const [suspendTarget, setSuspendTarget] = useState<MemberEntry | null>(null)
  const [reason, setReason] = useState('')
  const [reinstateTarget, setReinstateTarget] = useState<MemberEntry | null>(null)

  const filters = { q: debounced, suspended: onlySuspended || undefined, privileges: isAdmin }

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: qk.admin.members(filters),
    queryFn: () =>
      listMembers({
        q: debounced || undefined,
        suspended: onlySuspended || undefined,
        includePrivileges: isAdmin,
        limit: 30,
      }),
    staleTime: 15_000,
  })

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'members'] })
    void queryClient.invalidateQueries({ queryKey: qk.admin.stats })
  }

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: AppRole }) => setUserRole(id, role),
    onSuccess: () => { toast.success('Rôle mis à jour'); invalidate() },
    onError: (e) => toast.error(readableError(e)),
  })

  const suspend = useMutation({
    mutationFn: ({ id, motif }: { id: string; motif: string }) => suspendUser(id, motif),
    onSuccess: () => {
      toast.success('Compte suspendu', 'Le membre ne peut plus publier ni commenter.')
      setSuspendTarget(null); setReason(''); invalidate()
    },
    onError: (e) => toast.error(readableError(e)),
  })

  const reinstate = useMutation({
    mutationFn: (id: string) => reinstateUser(id),
    onSuccess: () => { toast.success('Compte réactivé'); setReinstateTarget(null); invalidate() },
    onError: (e) => toast.error(readableError(e)),
  })

  const busy = changeRole.isPending || suspend.isPending || reinstate.isPending

  return (
    <div className={s.screen}>
      <header className={s.head}>
        <h1 className={s.title}>Membres</h1>
        <p className={s.subtitle}>
          L'annuaire des comptes. Les mots de passe ne sont jamais accessibles, ici ni
          ailleurs.
        </p>
      </header>

      {!isAdmin ? (
        // Un moderateur n'a pas acces a `user_roles` ni `subscriptions` : plutot
        // que d'afficher « aucun role / non abonne » — ce qui serait FAUX — on
        // annonce la limite.
        <p className={s.notice}>
          <Icon name="info" size={16} />
          <span>
            Vous êtes modérateur : les rôles et le statut LEONIDA+ des membres vous sont
            fermés par la base. Ils s'affichent « non disponible », et non « aucun ».
          </span>
        </p>
      ) : null}

      <div className={s.filters}>
        <Input
          label="Rechercher"
          placeholder="Pseudo ou nom affiché"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          iconLeft={<Icon name="search" size={16} />}
          fieldClassName={s.searchField}
        />
        <Switch
          checked={onlySuspended}
          onChange={setOnlySuspended}
          label="Comptes suspendus uniquement"
        />
      </div>

      {isLoading ? (
        <>
          <Skeleton height="86px" radius="lg" />
          <Skeleton height="86px" radius="lg" />
        </>
      ) : isError ? (
        <ErrorState error={error} title="Annuaire indisponible" onRetry={() => void refetch()} />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState
          illustration={<Icon name="users" size={28} />}
          title={debounced ? 'Aucun membre trouvé' : 'Aucun membre inscrit'}
          description={
            debounced
              ? 'Aucun compte ne correspond à cette recherche.'
              : 'Les comptes créés sur LEONIDA apparaîtront ici.'
          }
        />
      ) : (
        <ul className={s.list}>
          {data?.items.map((entry) => {
            const role = topRole(entry.roles)
            const isSelf = entry.profile.id === user?.id

            return (
              <li key={entry.profile.id}>
                <Card variant="flat" padding="md" className={s.row}>
                  <div className={s.identity}>
                    <Avatar
                      src={entry.profile.avatar_url}
                      name={entry.profile.display_name ?? entry.profile.username}
                      size="md"
                      isPremium={entry.isPremium === true}
                    />
                    <div className={s.identityText}>
                      <Link to={`/profil/${entry.profile.username}`} className={s.username}>
                        @{entry.profile.username}
                      </Link>
                      <span className={s.meta}>
                        Inscrit le {formatDate(entry.profile.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className={s.badges}>
                    {entry.profile.is_suspended ? (
                      <Badge tone="danger" size="sm">Suspendu</Badge>
                    ) : null}
                    {role ? (
                      <Badge tone={role === 'admin' ? 'premium' : role === 'moderator' ? 'accent' : 'neutral'} size="sm">
                        {ROLE_LABELS[role]}
                      </Badge>
                    ) : (
                      <Badge tone="neutral" size="sm">Rôle non disponible</Badge>
                    )}
                    {entry.isPremium === true ? (
                      <Badge tone="premium" size="sm">LEONIDA+</Badge>
                    ) : entry.isPremium === null ? (
                      <span className={s.unknown}>Abonnement non disponible</span>
                    ) : null}
                  </div>

                  <div className={s.rowActions}>
                    {isAdmin ? (
                      <Select
                        aria-label={`Rôle de ${entry.profile.username}`}
                        value={role ?? 'member'}
                        disabled={busy || isSelf}
                        onChange={(e) =>
                          changeRole.mutate({ id: entry.profile.id, role: e.target.value as AppRole })
                        }
                        options={(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => ({
                          value: r,
                          label: ROLE_LABELS[r],
                        }))}
                      />
                    ) : null}

                    {entry.profile.is_suspended ? (
                      <Button variant="secondary" size="sm" disabled={busy}
                        onClick={() => setReinstateTarget(entry)}>
                        Réactiver
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" disabled={busy || isSelf}
                        onClick={() => { setSuspendTarget(entry); setReason('') }}>
                        Suspendre
                      </Button>
                    )}
                  </div>

                  {isSelf ? (
                    <p className={s.selfNote}>
                      Votre propre compte : les actions de modération sont désactivées.
                    </p>
                  ) : null}
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      {/* ----------------------------------------------- suspension ------- */}
      {suspendTarget ? (
        <div className={s.dialogBackdrop} role="presentation">
          <Card variant="raised" padding="lg" className={s.dialog}>
            <h2 className={s.dialogTitle}>Suspendre @{suspendTarget.profile.username} ?</h2>
            <p className={s.dialogText}>
              Le membre ne pourra plus publier, commenter, réagir ni proposer de
              découverte. Ses contenus déjà publiés restent en ligne.
            </p>
            <Textarea
              label="Motif"
              hint="Conservé dans le profil. Soyez précis : il justifie la décision."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              autoFocus
            />
            <div className={s.dialogActions}>
              <Button variant="ghost" onClick={() => setSuspendTarget(null)} disabled={busy}>
                Annuler
              </Button>
              <Button
                variant="danger"
                loading={busy}
                disabled={reason.trim().length === 0}
                onClick={() => suspend.mutate({ id: suspendTarget.profile.id, motif: reason })}
              >
                Suspendre
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(reinstateTarget)}
        title={reinstateTarget ? `Réactiver @${reinstateTarget.profile.username} ?` : ''}
        message="Le membre retrouvera immédiatement le droit de publier et de commenter."
        confirmLabel="Réactiver"
        tone="accent"
        loading={busy}
        onConfirm={() => reinstateTarget && reinstate.mutate(reinstateTarget.profile.id)}
        onCancel={() => setReinstateTarget(null)}
      />
    </div>
  )
}

export default AdminMembers
