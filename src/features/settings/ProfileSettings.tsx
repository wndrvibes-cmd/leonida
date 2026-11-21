import { useEffect, useState } from 'react'
import {
  Avatar, Button, Icon, ImageUploader, Input, Textarea, useToast,
} from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import { useDebounce } from '@/hooks/useDebounce'
import { useUpdateProfile, useUsernameAvailability } from '@/hooks/useProfile'
import { deleteUpload, type UploadedImage } from '@/lib/upload'
import { publicUrl, readableError } from '@/lib/supabase'
import { SettingsSection } from './SettingsSection'
import s from './ProfileSettings.module.css'

/** Limites alignees sur les contraintes CHECK de la table `profiles`. */
const USERNAME_MIN = 3
const USERNAME_MAX = 24
const DISPLAY_NAME_MAX = 48
const BIO_MAX = 400
const LOCATION_MAX = 64
const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/

const AVAILABILITY_DELAY = 400

/** Message d'erreur, ou `undefined` si le pseudonyme respecte les regles. */
function usernameError(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return 'Choisissez un pseudonyme.'
  if (trimmed.length < USERNAME_MIN) {
    return `Le pseudonyme doit contenir au moins ${USERNAME_MIN} caracteres.`
  }
  if (trimmed.length > USERNAME_MAX) {
    return `Le pseudonyme ne peut pas depasser ${USERNAME_MAX} caracteres.`
  }
  if (!USERNAME_PATTERN.test(trimmed)) {
    return 'Seules les lettres, les chiffres et le caractere _ sont acceptes.'
  }
  return undefined
}

/** `true` si le chemin est un fichier de bucket que l'on peut supprimer. */
function isBucketPath(path: string | null): path is string {
  return Boolean(path) && !/^https?:\/\//i.test(path as string)
}

/**
 * Onglet « Profil » des parametres.
 *
 * DEUX VERITES DU SOCLE SONT RESPECTEES ICI :
 *   - `profiles.avatar_url` et `banner_url` contiennent un CHEMIN de bucket
 *     (c'est ainsi que `UserMenu` les resout) : on enregistre donc
 *     `image.path`, pas l'URL publique ;
 *   - la policy `leonida_member_upload` (migration 0006) n'autorise les
 *     membres a ecrire que dans `avatars`, `posts`, `moments`,
 *     `contributions` et `backgrounds`. Le bucket `banners` est reserve a
 *     l'equipe : le depot de banniere est donc desactive et explique pour un
 *     membre, au lieu de produire un refus de la base.
 */
export function ProfileSettings() {
  const toast = useToast()
  const { user, profile, isStaff, isSuspended } = useAuth()
  const update = useUpdateProfile()

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [avatarPath, setAvatarPath] = useState<string | null>(null)
  const [bannerPath, setBannerPath] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  // Le profil arrive apres le premier rendu (session resolue en parallele) :
  // on initialise le formulaire des qu'il est connu, et a chaque changement
  // d'identite.
  useEffect(() => {
    if (!profile) return
    setUsername(profile.username)
    setDisplayName(profile.display_name ?? '')
    setBio(profile.bio ?? '')
    setLocation(profile.location ?? '')
    setAvatarPath(profile.avatar_url)
    setBannerPath(profile.banner_url)
  }, [profile])

  const debouncedUsername = useDebounce(username.trim(), AVAILABILITY_DELAY)
  const changedUsername = Boolean(profile) && debouncedUsername !== profile?.username
  const availability = useUsernameAvailability(
    changedUsername && !usernameError(debouncedUsername) ? debouncedUsername : '',
  )

  const localError = usernameError(username)
  const taken = changedUsername && availability.data === false
  const nameError = submitted ? localError : undefined

  const avatarUrl = publicUrl('avatars', avatarPath)
  const bannerUrl = publicUrl('banners', bannerPath)

  function handleUploaded(
    images: UploadedImage[],
    apply: (path: string | null) => void,
  ) {
    const first = images[0]
    if (first) apply(first.path)
  }

  /** Supprime l'ancien fichier devenu inutile. Un echec reste sans gravite. */
  async function cleanup(bucket: 'avatars' | 'banners', previous: string | null, next: string | null) {
    if (!isBucketPath(previous) || previous === next) return
    try {
      await deleteUpload(bucket, previous)
    } catch {
      // Le fichier orphelin reste dans le bucket : ce n'est pas une raison de
      // faire echouer un enregistrement qui, lui, a reussi.
    }
  }

  function save() {
    setSubmitted(true)
    if (localError || taken || !profile) return

    const previousAvatar = profile.avatar_url
    const previousBanner = profile.banner_url

    update.mutate(
      {
        username: username.trim(),
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        location: location.trim() || null,
        avatar_url: avatarPath,
        banner_url: bannerPath,
      },
      {
        onSuccess: () => {
          toast.success('Profil enregistre')
          void cleanup('avatars', previousAvatar, avatarPath)
          void cleanup('banners', previousBanner, bannerPath)
        },
        onError: (error) => {
          toast.error('Enregistrement impossible', readableError(error))
        },
      },
    )
  }

  if (!profile) {
    return (
      <SettingsSection title="Profil" icon="user">
        <p className={s.note}>
          Votre profil n'est pas encore charge. Rechargez la page : rien n'est modifiable
          tant que ses valeurs reelles ne sont pas connues.
        </p>
      </SettingsSection>
    )
  }

  const displayedName = displayName.trim() || username.trim() || profile.username

  return (
    <div className={s.wrap}>
      <SettingsSection
        title="Avatar"
        icon="camera"
        description="Visible partout ou vous publiez. Format carre conseille."
        footnote="JPEG, PNG, WebP ou AVIF, 2 Mo maximum (limite imposee par le bucket)."
      >
        <div className={s.media}>
          <div className={s.mediaPreview}>
            <Avatar src={avatarUrl} name={displayedName} size="xl" />
            {avatarPath ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAvatarPath(null)}
                iconLeft={<Icon name="close" size={16} />}
              >
                Retirer l'avatar
              </Button>
            ) : (
              <p className={s.hint}>Aucun avatar : vos initiales sont affichees.</p>
            )}
          </div>

          <ImageUploader
            bucket="avatars"
            userId={user?.id}
            label="Nouvel avatar"
            hint="L'image part immediatement ; elle ne remplace votre avatar qu'apres enregistrement."
            disabled={isSuspended}
            onUploaded={(images) => handleUploaded(images, setAvatarPath)}
            className={s.uploader}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Banniere"
        icon="image"
        description="Bandeau affiche en haut de votre profil public."
        footnote={
          isStaff
            ? 'JPEG, PNG, WebP ou AVIF, 12 Mo maximum.'
            : "Le depot dans le bucket « banners » est reserve a l'equipe LEONIDA (politique de stockage de la migration 0006). Vous pouvez en revanche retirer la banniere affichee sur votre profil."
        }
      >
        <div className={s.media}>
          <div className={s.bannerPreview}>
            {bannerUrl ? (
              <img className={s.bannerImage} src={bannerUrl} alt="Banniere actuelle" />
            ) : (
              <span className={s.bannerEmpty}>
                Aucune banniere : un degrade Leonida est affiche a la place.
              </span>
            )}
          </div>

          <div className={s.bannerActions}>
            {bannerPath ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBannerPath(null)}
                iconLeft={<Icon name="close" size={16} />}
              >
                Retirer la banniere
              </Button>
            ) : null}

            {isStaff ? (
              <ImageUploader
                bucket="banners"
                userId={user?.id}
                label="Nouvelle banniere"
                hint="Format panoramique conseille (environ 4:1)."
                onUploaded={(images) => handleUploaded(images, setBannerPath)}
                className={s.uploader}
              />
            ) : null}
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Identite"
        icon="user"
        description="Ces informations apparaissent sur votre profil public."
        footnote="Votre adresse e-mail n'est jamais affichee publiquement."
      >
        <Input
          label="Pseudonyme"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          maxLength={USERNAME_MAX}
          required
          autoComplete="username"
          spellCheck={false}
          hint={`De ${USERNAME_MIN} a ${USERNAME_MAX} caracteres : lettres, chiffres et _ uniquement. Il apparait dans l'adresse de votre profil.`}
          error={nameError ?? (taken ? 'Ce pseudonyme est deja pris. Choisissez-en un autre.' : null)}
          addonRight={
            changedUsername && !localError ? (
              <span className={s.availability}>
                {availability.isFetching
                  ? 'Verification…'
                  : availability.data === true
                    ? 'Disponible'
                    : availability.data === false
                      ? 'Deja pris'
                      : ''}
              </span>
            ) : undefined
          }
        />

        <Input
          label="Nom affiche"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          maxLength={DISPLAY_NAME_MAX}
          hint={`Facultatif, ${DISPLAY_NAME_MAX} caracteres maximum. Sans nom affiche, votre pseudonyme est utilise.`}
        />

        <Textarea
          label="Description"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          maxLength={BIO_MAX}
          showCount
          rows={4}
          hint="Quelques lignes sur vous : votre style de jeu, ce que vous cherchez dans Leonida."
        />

        <Input
          label="Localisation"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          maxLength={LOCATION_MAX}
          hint="Facultatif et libre : une ville, un pays, une region."
          iconLeft={<Icon name="pin" size={16} />}
        />
      </SettingsSection>

      <div className={s.save}>
        <Button
          onClick={save}
          loading={update.isPending}
          disabled={Boolean(localError) || taken || isSuspended}
          iconLeft={<Icon name="check" size={18} />}
        >
          Enregistrer mon profil
        </Button>
        {isSuspended ? (
          <p className={s.note}>
            Votre compte est suspendu : la modification du profil est bloquee par la
            moderation.
          </p>
        ) : null}
      </div>
    </div>
  )
}
