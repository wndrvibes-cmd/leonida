import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Icon, Input, Spinner } from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import {
  isUsernameAvailable,
  passwordStrength,
  useAuthActions,
  validateEmail,
  validatePassword,
  validateUsername,
  type FieldErrors,
} from '@/features/auth/useAuthActions'
import s from '@/features/auth/AuthForm.module.css'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { loading, error, setError, signUp } = useAuthActions()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fields, setFields] = useState<FieldErrors>({})
  const [checkingName, setCheckingName] = useState(false)
  const [emailSent, setEmailSent] = useState<string | null>(null)

  const strength = passwordStrength(password)
  const checkToken = useRef(0)

  useEffect(() => {
    if (session) navigate('/', { replace: true })
  }, [session, navigate])

  // Verification de disponibilite du pseudo, apres une pause de saisie.
  useEffect(() => {
    const invalid = validateUsername(username)
    if (invalid) return

    const token = ++checkToken.current
    setCheckingName(true)

    const timer = setTimeout(async () => {
      const free = await isUsernameAvailable(username)
      if (token !== checkToken.current) return
      setCheckingName(false)
      setFields((f) => ({ ...f, username: free ? undefined : 'Ce pseudo est déjà pris.' }))
    }, 450)

    return () => {
      clearTimeout(timer)
      setCheckingName(false)
    }
  }, [username])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const next: FieldErrors = {
      username: validateUsername(username),
      email: validateEmail(email),
      password: validatePassword(password),
    }
    setFields(next)
    if (next.username || next.email || next.password) return

    if (!(await isUsernameAvailable(username))) {
      setFields((f) => ({ ...f, username: 'Ce pseudo est déjà pris.' }))
      return
    }

    const result = await signUp(email.trim(), password, username.trim())
    if (!result) return

    // Supabase n'a pas ouvert de session : la confirmation par e-mail est
    // activee sur le projet. On le dit clairement au lieu de laisser croire
    // que le compte est immediatement utilisable.
    if (result.needsEmailConfirmation) {
      setEmailSent(email.trim())
      return
    }

    navigate('/connexion', { replace: true, state: { justRegistered: true } })
  }

  if (emailSent) {
    return (
      <>
        <header className={s.head}>
          <h1 className={s.title}>Vérifiez vos e-mails</h1>
        </header>
        <p className={s.notice}>
          <Icon name="check" size={18} />
          <span>
            Un lien de confirmation vient d'être envoyé a <strong>{emailSent}</strong>.
            Ouvrez-le pour activer votre compte, puis revenez vous connecter.
            Pensez a regarder dans vos indesirables.
          </span>
        </p>
        <p className={s.foot}>
          <Link to="/connexion" className={s.inlineLink}>
            Aller a la connexion
          </Link>
        </p>
      </>
    )
  }

  return (
    <>
      <header className={s.head}>
        <h1 className={s.title}>Rejoindre LEONIDA</h1>
        <p className={s.subtitle}>
          Partagez vos découvertes et explorez Leonida avec la communauté.
        </p>
      </header>

      <form className={s.form} onSubmit={handleSubmit} noValidate>
        {error ? (
          <p className={s.alert} role="alert">
            <Icon name="alert" size={18} />
            <span>{error}</span>
          </p>
        ) : null}

        <div>
          <Input
            label="Pseudo"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={fields.username}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={24}
            required
            iconLeft={<Icon name="user" size={16} />}
          />
          {checkingName ? (
            <span className={s.checking}>
              <Spinner size="sm" /> Vérification de la disponibilité…
            </span>
          ) : (
            <p className={s.rules}>
              3 a 24 caractères : lettres, chiffres et underscores uniquement.
            </p>
          )}
        </div>

        <Input
          label="Adresse e-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fields.email}
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          required
        />

        <Input
          label="Mot de passe"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fields.password}
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

        <div className={s.actions}>
          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
            Creer mon compte
          </Button>
        </div>
      </form>

      <p className={s.foot}>
        Vous avez déjà un compte ?
        <Link to="/connexion" className={s.inlineLink}>
          Se connecter
        </Link>
      </p>
    </>
  )
}
