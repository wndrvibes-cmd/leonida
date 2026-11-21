import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, ConfirmDialog, Icon, Input, useToast } from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import { useAppIdentity } from '@/hooks/useAppSettings'
import { supabase, readableError } from '@/lib/supabase'
import { passwordStrength, validatePassword } from '@/features/auth/useAuthActions'
import { formatDate } from '@/lib/format'
import { SettingsSection } from './SettingsSection'
import s from './AccountSettings.module.css'

export function AccountSettings() {
  const { user, profile, signOut } = useAuth()
  const { data: identity } = useAppIdentity()
  const contact = identity?.contactEmail ?? null
  const navigate = useNavigate()
  const toast = useToast()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldError, setFieldError] = useState<string>()
  const [saving, setSaving] = useState(false)
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  const strength = passwordStrength(password)

  async function changePassword(event: FormEvent) {
    event.preventDefault()
    const invalid = validatePassword(password)
    if (invalid) return setFieldError(invalid)
    if (password !== confirm) return setFieldError('Les deux mots de passe ne correspondent pas.')
    setFieldError(undefined)

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setPassword('')
      setConfirm('')
      toast.success('Mot de passe modifié')
    } catch (error) {
      toast.error(readableError(error))
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <>
      <SettingsSection
        title="Compte"
        icon="shield"
        description="Vos informations de connexion."
      >
        <dl className={s.facts}>
          <div className={s.fact}>
            <dt>Adresse e-mail</dt>
            <dd>{user?.email ?? '—'}</dd>
          </div>
          <div className={s.fact}>
            <dt>Membre depuis</dt>
            <dd>{profile?.created_at ? formatDate(profile.created_at) : '—'}</dd>
          </div>
        </dl>
      </SettingsSection>

      <SettingsSection
        title="Mot de passe"
        icon="lock"
        description="Choisissez un mot de passe que vous n'utilisez pas ailleurs."
        footnote="Modifier votre mot de passe ne vous déconnecte pas de vos autres appareils."
      >
        <form className={s.form} onSubmit={changePassword} noValidate>
          <Input
            label="Nouveau mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          {password ? (
            <div className={s.strength}>
              <div className={s.bars} aria-hidden="true">
                {[1, 2, 3, 4].map((level) => (
                  <span
                    key={level}
                    className={s.bar}
                    data-level={strength.score}
                    data-filled={strength.score >= level}
                  />
                ))}
              </div>
              <span className={s.strengthLabel}>Robustesse : {strength.label}</span>
            </div>
          ) : null}
          <Input
            label="Confirmer"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={fieldError}
            autoComplete="new-password"
          />
          <div>
            <Button type="submit" variant="primary" loading={saving} disabled={!password}>
              Enregistrer le mot de passe
            </Button>
          </div>
        </form>
      </SettingsSection>

      <SettingsSection title="Session" icon="logout">
        <div className={s.row}>
          <p className={s.help}>Vous déconnecter de cet appareil.</p>
          <Button
            variant="secondary"
            onClick={() => setConfirmSignOut(true)}
            iconLeft={<Icon name="logout" size={16} />}
          >
            Se déconnecter
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Supprimer mon compte"
        icon="trash"
        description="Fermeture définitive de votre compte LEONIDA."
      >
        {/*
          HONNETETE : la suppression d'un compte exige la cle `service_role`,
          donc une Edge Function cote serveur. Elle n'est pas encore ecrite.
          Plutot qu'un bouton qui echouerait ou, pire, qui ferait croire a une
          suppression, on explique la procedure reelle.
        */}
        <div className={s.danger}>
          <p className={s.dangerLead}>
            <Icon name="alert" size={18} />
            <span>Cette fonctionnalité n'est pas encore automatisée.</span>
          </p>
          <p className={s.help}>
            Supprimer un compte demande une opération côté serveur que l'application ne
            sait pas encore faire seule.{' '}
            {contact ? (
              <>
                En attendant, écrivez à{' '}
                <a href={`mailto:${contact}?subject=Suppression%20de%20mon%20compte%20LEONIDA`}>
                  {contact}
                </a>{' '}
                depuis l'adresse de votre compte : la demande est traitée à la main.
              </>
            ) : (
              <>
                Aucune adresse de contact n'est encore publiée : l'administration doit la
                renseigner dans les réglages de l'application.
              </>
            )}
          </p>
          <p className={s.help}>
            Ce qui sera supprimé : votre profil, vos publications, vos moments, vos
            commentaires, vos favoris et vos réglages. Vos découvertes déjà validées
            restent sur la carte, mais ne vous sont plus attribuées.
          </p>
        </div>
      </SettingsSection>

      <ConfirmDialog
        open={confirmSignOut}
        title="Se déconnecter ?"
        message="Vous devrez saisir à nouveau vos identifiants pour revenir."
        confirmLabel="Se déconnecter"
        onConfirm={handleSignOut}
        onCancel={() => setConfirmSignOut(false)}
      />
    </>
  )
}

export default AccountSettings
