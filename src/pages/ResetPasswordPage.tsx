import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Icon, Input, Spinner } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  passwordStrength,
  useAuthActions,
  validatePassword,
} from '@/features/auth/useAuthActions'
import s from '@/features/auth/AuthForm.module.css'

type LinkState = 'checking' | 'valid' | 'invalid'

/**
 * Ecran atteint depuis le lien recu par e-mail.
 *
 * Supabase place un jeton de recuperation dans l'URL ; le client est configure
 * avec `detectSessionInUrl: true` et ouvre donc une session temporaire. Si
 * aucune session n'apparaît, c'est que le lien est expire ou deja utilise :
 * on le dit, on ne propose pas un formulaire qui echouerait.
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { loading, error, setError, updatePassword } = useAuthActions()

  const [linkState, setLinkState] = useState<LinkState>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldError, setFieldError] = useState<string>()
  const [done, setDone] = useState(false)

  const strength = passwordStrength(password)

  useEffect(() => {
    let active = true

    // L'événement PASSWORD_RECOVERY arrive quand le jeton de l'URL est accepte.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return
      if (event === 'PASSWORD_RECOVERY' || session) setLinkState('valid')
    })

    // Repli : si rien ne s'est produit, on interroge la session directement.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setLinkState((current) =>
        current === 'valid' ? current : data.session ? 'valid' : 'invalid',
      )
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const invalid = validatePassword(password)
    if (invalid) {
      setFieldError(invalid)
      return
    }
    if (password !== confirm) {
      setFieldError('Les deux mots de passe ne correspondent pas.')
      return
    }
    setFieldError(undefined)

    const ok = await updatePassword(password)
    if (!ok) return

    setDone(true)
    await supabase.auth.signOut()
    setTimeout(() => navigate('/connexion', { replace: true }), 2200)
  }

  if (linkState === 'checking') {
    return (
      <div className={s.checking}>
        <Spinner size="md" /> Vérification du lien…
      </div>
    )
  }

  if (linkState === 'invalid') {
    return (
      <>
        <header className={s.head}>
          <h1 className={s.title}>Lien invalide</h1>
        </header>
        <p className={s.alert} role="alert">
          <Icon name="alert" size={18} />
          <span>
            Ce lien de reinitialisation est expiré ou a déjà été utilise.
            Demandez-en un nouveau.
          </span>
        </p>
        <p className={s.foot}>
          <Link to="/mot-de-passe-oublie" className={s.inlineLink}>
            Demander un nouveau lien
          </Link>
        </p>
      </>
    )
  }

  if (done) {
    return (
      <>
        <header className={s.head}>
          <h1 className={s.title}>Mot de passe modifie</h1>
        </header>
        <p className={s.notice}>
          <Icon name="check" size={18} />
          <span>Vous allez être redirige vers la connexion…</span>
        </p>
      </>
    )
  }

  return (
    <>
      <header className={s.head}>
        <h1 className={s.title}>Nouveau mot de passe</h1>
        <p className={s.subtitle}>Choisissez un mot de passe que vous n'utilisez pas ailleurs.</p>
      </header>

      <form className={s.form} onSubmit={handleSubmit} noValidate>
        {error ? (
          <p className={s.alert} role="alert">
            <Icon name="alert" size={18} />
            <span>{error}</span>
          </p>
        ) : null}

        <Input
          label="Nouveau mot de passe"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          addonRight={
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              aria-pressed={showPassword}
            >
              <Icon name="eye" size={16} />
            </Button>
          }
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
          label="Confirmer le mot de passe"
          type={showPassword ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={fieldError}
          autoComplete="new-password"
          required
        />

        <div className={s.actions}>
          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
            Enregistrer
          </Button>
        </div>
      </form>
    </>
  )
}
