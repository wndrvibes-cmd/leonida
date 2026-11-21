import { motion } from 'framer-motion'
import { ErrorState, Skeleton, cx, useToast } from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import { useReduceMotion } from '@/hooks/useReduceMotion'
import { useReactionSummary, useToggleReaction } from '@/hooks/useReactions'
import { REACTIONS } from '@/lib/constants'
import { formatCount } from '@/lib/format'
import { readableError } from '@/lib/supabase'
import { useLoginPrompt } from './useLoginPrompt'
import type { ReactionType, TargetType } from './types'
import s from './ReactionBar.module.css'

export interface ReactionBarProps {
  targetType: TargetType
  targetId: string
  size?: 'sm' | 'md'
  /**
   * Masque les reactions encore a zero. Si AUCUNE reaction n'a ete posee, la
   * barre complete reste affichee : sinon plus personne ne pourrait reagir.
   */
  hideEmpty?: boolean
  className?: string
}

/**
 * Barre de reactions.
 *
 * A RESERVER AUX PAGES DE DETAIL. Elle s'appuie sur `useReactionSummary`, qui
 * compte chaque type separement : six requetes par contenu (voir l'avertissement
 * en tete de `src/services/reactions.ts`). Dans un FEED, ne pas la monter par
 * ligne — ce serait plus de cent requetes pour vingt publications. Utiliser a
 * la place `useMyReactions(targetType, ids)` en un seul lot, avec le total deja
 * present sur la ligne (`posts.reaction_count`).
 */
export function ReactionBar({
  targetType,
  targetId,
  size = 'md',
  hideEmpty = false,
  className,
}: ReactionBarProps) {
  const toast = useToast()
  const promptLogin = useLoginPrompt()
  const reduceMotion = useReduceMotion()
  const { user, isSuspended } = useAuth()

  const summary = useReactionSummary(targetType, targetId)
  const toggle = useToggleReaction(targetType, targetId)

  if (summary.isLoading) {
    return (
      <div className={cx(s.bar, size === 'sm' && s.sm, className)} aria-busy="true">
        {REACTIONS.map((reaction) => (
          <Skeleton key={reaction.value} width={64} height={36} radius="full" />
        ))}
      </div>
    )
  }

  if (summary.isError) {
    return (
      <ErrorState
        compact
        error={summary.error}
        title="Réactions indisponibles"
        onRetry={() => void summary.refetch()}
        className={className}
      />
    )
  }

  const data = summary.data
  if (!data) return null

  const hasAny = data.total > 0
  const visible =
    hideEmpty && hasAny
      ? REACTIONS.filter((r) => data.counts[r.value] > 0 || data.mine === r.value)
      : REACTIONS

  function handleClick(reaction: ReactionType, isMine: boolean) {
    if (!user) {
      promptLogin('Connectez-vous pour réagir', 'Les réactions sont réservées aux membres.')
      return
    }

    // Un compte suspendu peut RETIRER sa reaction (policy delete) mais pas en
    // poser une nouvelle (policy insert). On le dit avant l'aller-retour.
    if (isSuspended && !isMine) {
      toast.error(
        'Compte suspendu',
        'Vous ne pouvez pas réagir tant que votre compte est suspendu.',
      )
      return
    }

    toggle.mutate(reaction, {
      onError: (mutationError) => {
        toast.error('Réaction impossible', readableError(mutationError))
      },
    })
  }

  return (
    <div
      className={cx(s.bar, size === 'sm' && s.sm, className)}
      role="group"
      aria-label="Réactions"
      aria-busy={toggle.isPending || undefined}
    >
      {visible.map((reaction) => {
        const count = data.counts[reaction.value]
        const isMine = data.mine === reaction.value

        return (
          <motion.button
            key={reaction.value}
            type="button"
            className={cx(s.pill, isMine && s.isMine)}
            onClick={() => handleClick(reaction.value, isMine)}
            aria-pressed={isMine}
            aria-label={
              count > 0
                ? `${reaction.label} — ${count} reaction${count > 1 ? 's' : ''}`
                : reaction.label
            }
            title={reaction.label}
            whileTap={reduceMotion ? undefined : { scale: 0.92 }}
          >
            <span className={s.emoji} aria-hidden="true">
              {reaction.emoji}
            </span>
            {count > 0 ? <span className={s.count}>{formatCount(count)}</span> : null}
          </motion.button>
        )
      })}
    </div>
  )
}
