import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, EmptyState, ErrorState, Icon, Skeleton, Tabs, type TabItem } from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import { useProfileByUsername } from '@/hooks/useProfile'
import { useProfileStats } from '@/hooks/useProfileStats'
import { ProfileDiscoveries } from './ProfileDiscoveries'
import { ProfileHeader } from './ProfileHeader'
import { ProfilePostList } from './ProfilePostList'
import { ProfileStatsRow } from './ProfileStatsRow'
import { useProfilePremium } from './profileQueries'
import s from './ProfileScreen.module.css'

type TabValue = 'publications' | 'moments' | 'decouvertes'

const TAB_VALUES: readonly TabValue[] = ['publications', 'moments', 'decouvertes']

function readTab(raw: string | null): TabValue {
  return TAB_VALUES.includes(raw as TabValue) ? (raw as TabValue) : 'publications'
}

export interface ProfileScreenProps {
  /** Pseudonyme issu de l'URL `/profil/:username`. */
  username: string | undefined
}

/**
 * Profil public d'un membre.
 *
 * Les FAVORIS n'y figurent jamais : la policy `favorites_own` les reserve a
 * leur proprietaire, et ils resteraient prives meme si l'interface tentait de
 * les afficher. Un rappel discret renvoie le membre vers sa propre liste.
 */
export function ProfileScreen({ username }: ProfileScreenProps) {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()

  const query = useProfileByUsername(username)
  const profile = query.data ?? null

  const stats = useProfileStats(profile?.id)
  const premium = useProfilePremium(profile?.id)

  const isSelf = Boolean(profile && user && profile.id === user.id)
  const tab = readTab(params.get('onglet'))

  // L'onglet vit dans l'URL : un profil se partage sur l'onglet consulte, et
  // le bouton « retour » du navigateur revient a l'onglet precedent.
  const selectTab = useCallback(
    (next: string) => {
      setParams(
        (previous) => {
          const copy = new URLSearchParams(previous)
          if (next === 'publications') copy.delete('onglet')
          else copy.set('onglet', next)
          return copy
        },
        { replace: true },
      )
    },
    [setParams],
  )

  /* ------------------------------------------------------------ chargement */
  if (query.isPending) {
    return (
      <div className={`${s.page} page`} aria-busy="true">
        <Skeleton height={190} radius="lg" />
        <Skeleton height={92} radius="lg" />
        <Skeleton height={44} radius="full" />
        <Skeleton height={104} radius="lg" />
      </div>
    )
  }

  /* ---------------------------------------------------------------- erreur */
  if (query.isError) {
    return (
      <section className={`${s.page} page`}>
        <ErrorState
          error={query.error}
          title="Profil indisponible"
          onRetry={() => void query.refetch()}
        />
      </section>
    )
  }

  /* ------------------------------------------------------------------- 404 */
  if (!profile) {
    return (
      <section className={`${s.page} page`}>
        <EmptyState
          illustration={<Icon name="user" size={40} />}
          title="Membre introuvable"
          description={
            username
              ? `Aucun membre ne porte le pseudonyme « ${username} ». Il a peut-etre ete change, ou le compte a ete supprime.`
              : 'Cette adresse ne désigné aucun membre.'
          }
          action={
            <Button as="link" to="/communaute" variant="secondary" iconLeft={<Icon name="community" size={18} />}>
              Voir la communauté
            </Button>
          }
        />
      </section>
    )
  }

  /* ---------------------------------------------------------------- succes */
  const name = profile.display_name?.trim() || profile.username

  const items: TabItem[] = [
    { value: 'publications', label: 'Publications', icon: <Icon name="community" size={16} /> },
    { value: 'moments', label: 'Moments', icon: <Icon name="moments" size={16} /> },
    { value: 'decouvertes', label: 'Découvertes validées', icon: <Icon name="compass" size={16} /> },
  ]

  return (
    <section className={`${s.page} page`}>
      <ProfileHeader profile={profile} isSelf={isSelf} premium={premium} />

      <ProfileStatsRow
        stats={stats.data}
        isPending={stats.isPending}
        isError={stats.isError}
        error={stats.error}
        onRetry={() => void stats.refetch()}
      />

      <div className={s.tabs}>
        <Tabs items={items} value={tab} onChange={selectTab} ariaLabel="Contributions du membre" />
      </div>

      <div className={s.panel}>
        {tab === 'publications' ? (
          <ProfilePostList authorId={profile.id} surface="community" name={name} isSelf={isSelf} />
        ) : tab === 'moments' ? (
          <ProfilePostList authorId={profile.id} surface="moment" name={name} isSelf={isSelf} />
        ) : (
          <ProfileDiscoveries authorId={profile.id} name={name} isSelf={isSelf} />
        )}
      </div>

      {isSelf ? (
        <p className={s.privacy}>
          <Icon name="lock" size={15} />
          <span>
            Vos favoris n'apparaissent pas sur votre profil : ils restent privés.{' '}
            <Link to="/favoris" className={s.privacyLink}>
              Voir mes favoris
            </Link>
          </span>
        </p>
      ) : null}
    </section>
  )
}

export default ProfileScreen
