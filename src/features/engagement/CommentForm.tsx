import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, Icon, Textarea, cx } from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import { readableError } from '@/lib/supabase'
import s from './CommentForm.module.css'

/** Aligne sur la contrainte `length(body) <= 4000` de la table `comments`. */
export const COMMENT_MAX_LENGTH = 4000

export interface CommentFormProps {
  /**
   * Envoi reel. Si la promesse echoue, le texte saisi est CONSERVE et
   * l'erreur s'affiche : on ne fait jamais perdre un message a un membre.
   */
  onSubmit: (body: string) => Promise<unknown>
  /** Texte de depart (mode edition). */
  initialValue?: string
  placeholder?: string
  submitLabel?: string
  /** Affiche « Annuler » : utilise pour une reponse ou une edition. */
  onCancel?: () => void
  autoFocus?: boolean
  /**
   * Verrouille la saisie avec une explication visible, EN PLUS des cas
   * deduits automatiquement (visiteur non connecte, compte suspendu).
   */
  disabledReason?: string | null
  compact?: boolean
  className?: string
}

export function CommentForm({
  onSubmit,
  initialValue = '',
  placeholder = 'Écrire un commentaire...',
  submitLabel = 'Publier',
  onCancel,
  autoFocus = false,
  disabledReason,
  compact = false,
  className,
}: CommentFormProps) {
  const { user, isSuspended } = useAuth()
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Les regles ci-dessous ne protegent RIEN : la RLS refuse deja l'insertion
  // d'un membre suspendu ou anonyme. Elles evitent seulement de proposer une
  // action qui echouerait, et expliquent pourquoi.
  const locked =
    disabledReason ??
    (!user
      ? 'Connectez-vous pour participer à la discussion.'
      : isSuspended
        ? 'Votre compte est suspendu : vous ne pouvez pas publier de commentaire.'
        : null)

  if (locked) {
    return (
      <div className={cx(s.locked, className)} role="note">
        <Icon name="lock" size={18} className={s.lockIcon} />
        <p className={s.lockedText}>{locked}</p>
        {!user ? (
          <Link to="/connexion" className={s.lockedLink}>
            Se connecter
          </Link>
        ) : null}
      </div>
    )
  }

  const trimmed = value.trim()
  const canSubmit = trimmed.length > 0 && !submitting

  async function submit() {
    if (!canSubmit) return

    setError(null)
    setSubmitting(true)
    try {
      await onSubmit(trimmed)
      setValue('')
    } catch (submitError) {
      setError(readableError(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void submit()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Raccourci clavier de confort sur ordinateur ; sans effet au doigt.
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()
      void submit()
    }
  }

  return (
    <form className={cx(s.form, compact && s.compact, className)} onSubmit={handleSubmit} noValidate>
      <Textarea
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          // L'erreur precedente ne vaut plus des que le texte change.
          if (error) setError(null)
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={COMMENT_MAX_LENGTH}
        showCount
        rows={compact ? 2 : 3}
        autoFocus={autoFocus}
        error={error}
        disabled={submitting}
        aria-label="Votre commentaire"
      />

      <div className={s.actions}>
        {onCancel ? (
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
            Annuler
          </Button>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={submitting}
          disabled={!canSubmit}
          iconLeft={<Icon name="send" size={16} />}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
