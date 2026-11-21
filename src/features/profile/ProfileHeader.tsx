import { useId } from 'react'
import { Avatar, Badge, Button, Icon } from '@/components/ui'
import { ShareButton } from '@/features/engagement'
import { formatDate } from '@/lib/format'
import { publicUrl } from '@/lib/supabase'
import type { Profile } from '@/services/profiles'
import type { PremiumStatus } from './profileQueries'
import s from './ProfileHeader.module.css'

export interface ProfileHeaderProps {
  profile: Profile
  /** Le visiteur consulte son propre profil. */
  isSelf: boolean
  premium: PremiumStatus
}

/**
 * En-tete du profil public : banniere, avatar, identite, presentation.
 *
 * Deux choix d'honnetete y sont visibles :
 *   - le badge LEONIDA+ n'apparait que si l'abonnement est REELLEMENT
 *     connaissable (soi-meme, ou staff) — voir `PremiumStatus` ;
 *   - le signalement d'un MEMBRE n'existe pas en base (l'enum `target_type`
 *     ne couvre que des contenus) : le bouton est donc desactive et explique,
 *     jamais simule.
 */
export function ProfileHeader({ profile, isSelf, premium }: ProfileHeaderProps) {
  const reportNoteId = useId()

  const name = profile.display_name?.trim() || profile.username
  const bannerUrl = publicUrl('banners', profile.banner_url)
  const avatarUrl = publicUrl('avatars', profile.avatar_url)
  const showPremium = premium.known && premium.isPremium

  return (
    <header className={s.header}>
      <div className={s.banner}>
        {bannerUrl ? (
          <img
            className={s.bannerImage}
            src={bannerUrl}
            alt={`Banniere de ${name}`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className={s.bannerFallback} aria-hidden="true" />
        )}
        <span className={s.bannerScrim} aria-hidden="true" />
      </div>

      <div className={s.body}>
        <div className={s.avatarSlot}>
          <Avatar src={avatarUrl} name={name} size="xl" isPremium={showPremium} />
        </div>

        <div className={s.identity}>
          <div className={s.nameRow}>
            <h1 className={s.name}>{name}</h1>
            {showPremium ? (
              <Badge tone="premium" size="sm" icon={<Icon name="crown" size={12} />}>
                LEONIDA+
              </Badge>
            ) : null}
            {profile.is_suspended ? (
              <Badge tone="danger" size="sm" title="Ce compte est suspendu par la moderation.">
                Compte suspendu
              </Badge>
            ) : null}
          </div>

          <p className={s.handle}>@{profile.username}</p>

          {profile.bio?.trim() ? <p className={s.bio}>{profile.bio}</p> : null}

          <ul className={s.meta}>
            {profile.location?.trim() ? (
              <li className={s.metaItem}>
                <Icon name="pin" size={15} />
                {profile.location}
              </li>
            ) : null}
            <li className={s.metaItem}>
              <Icon name="calendar" size={15} />
              <span>
                Membre depuis{' '}
                <time dateTime={profile.created_at}>{formatDate(profile.created_at)}</time>
              </span>
            </li>
          </ul>
        </div>

        <div className={s.actions}>
          {isSelf ? (
            <Button
              as="link"
              to="/parametres"
              variant="secondary"
              size="sm"
              iconLeft={<Icon name="edit" size={16} />}
            >
              Modifier mon profil
            </Button>
          ) : null}

          <ShareButton
            url={`/profil/${profile.username}`}
            title={`${name} sur LEONIDA`}
            text={`Le profil de ${name} sur LEONIDA.`}
            withLabel
            size="sm"
          />

          {!isSelf ? (
            <div className={s.reportSlot}>
              <Button
                variant="ghost"
                size="sm"
                disabled
                iconLeft={<Icon name="flag" size={16} />}
                aria-describedby={reportNoteId}
              >
                Signaler ce membre
              </Button>
              <p className={s.reportNote} id={reportNoteId}>
                Le signalement d'un membre n'est pas encore possible : seuls les contenus
                (publication, actualite, decouverte, commentaire, concours) peuvent etre
                signales. Utilisez le bouton de signalement present sur la publication
                concernee.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
