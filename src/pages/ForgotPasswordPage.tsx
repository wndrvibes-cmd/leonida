import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, Icon, Input } from '@/components/ui'
import { useAuthActions, validateEmail } from '@/features/auth/useAuthActions'
import s from '@/features/auth/AuthForm.module.css'

export default function ForgotPasswordPage() {
  const { loading, error, setError, requestPasswordReset } = useAuthActions()
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string>()
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const invalid = validateEmail(email)
    setEmailError(invalid)
    if (invalid) return

    const ok = await requestPasswordReset(email.trim())
    if (ok) setSent(true)
  }

  if (sent) {
    return (
      <>
        <header className={s.head}>
          <h1 className={s.title}>Lien envoyé</h1>
        </header>
        <p className={s.notice}>
          <Icon name="check" size={18} />
          <span>
            Si un compte LEONIDA est associe a <strong>{email.trim()}</strong>, un lien de
            reinitialisation vient d'y être envoyé. Il est valable un court moment.
            Pensez a vérifier vos indesirables.
          </span>
        </p>
        <p className={s.foot}>
          <Link to="/connexion" className={s.inlineLink}>
            Retour a la connexion
          </Link>
        </p>
      </>
    )
  }

  return (
    <>
      <header className={s.head}>
        <h1 className={s.title}>Mot de passe oublie</h1>
        <p className={s.subtitle}>
          Indiquez votre adresse e-mail : nous vous enverrons un lien pour definir
          un nouveau mot de passe.
        </p>
      </header>

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
        />

        <div className={s.actions}>
          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
            Envoyer le lien
          </Button>
        </div>
      </form>

      <p className={s.foot}>
        <Link to="/connexion" className={s.inlineLink}>
          Retour a la connexion
        </Link>
      </p>
    </>
  )
}
