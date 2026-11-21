import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, Icon, Input } from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import { useAuthActions, validateEmail } from '@/features/auth/useAuthActions'
import s from '@/features/auth/AuthForm.module.css'

interface RedirectState {
  from?: { pathname: string }
  justRegistered?: boolean
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useAuth()
  const { loading, error, setError, signIn } = useAuthActions()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState<string>()

  const state = location.state as RedirectState | null
  const destination = state?.from?.pathname ?? '/'

  // Deja connecte (ou connexion qui vient d'aboutir) : on repart vers la
  // page initialement demandee.
  useEffect(() => {
    if (session) navigate(destination, { replace: true })
  }, [session, destination, navigate])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const invalid = validateEmail(email)
    setEmailError(invalid)
    if (invalid) return

    await signIn(email.trim(), password)
    // La redirection est geree par l'effet ci-dessus des que la session existe.
  }

  return (
    <>
      <header className={s.head}>
        <h1 className={s.title}>Content de vous revoir</h1>
        <p className={s.subtitle}>Connectez-vous pour retrouver la communauté Leonida.</p>
      </header>

      {state?.justRegistered ? (
        <p className={s.notice}>
          <Icon name="check" size={18} />
          <span>Votre compte est créé. Connectez-vous pour continuer.</span>
        </p>
      ) : null}

      <form className={s.form} onSubmit={handleSubmit} noValidate>
        {error ? (
          <p className={s.alert} role="alert">
            <Icon name="alert" size={18} />
            <span>{error}</span>
          </p>
        ) : null}

        <Input
          label="Adresse e-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          iconLeft={<Icon name="user" size={16} />}
        />

        <Input
          label="Mot de passe"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
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

        <Link to="/mot-de-passe-oublie" className={s.forgot}>
          Mot de passe oublie ?
        </Link>

        <div className={s.actions}>
          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
            Se connecter
          </Button>
        </div>
      </form>

      <p className={s.foot}>
        Pas encore de compte ?
        <Link to="/inscription" className={s.inlineLink}>
          Rejoindre LEONIDA
        </Link>
      </p>
    </>
  )
}
