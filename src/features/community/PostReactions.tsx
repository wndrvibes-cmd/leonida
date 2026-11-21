import { motion } from 'framer-motion'
import { cx, useToast } from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import { useLoginPrompt } from '@/features/engagement'
import { useReduceMotion } from '@/hooks/useReduceMotion'
import { REACTIONS } from '@/lib/constants'
import { formatCount } from '@/lib/format'
import { readableError } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { usePostQuickReaction } from './useCommunity'
import s from './PostReactions.module.css'

type ReactionType = Database['public']['Enums']['reaction_type']

export interface PostReactionsProps {
  postId: string
  /** Total reel, lu dans `posts.reaction_count` (compteur tenu par un declencheur). */
  total: number
  /** Reaction du membre, fournie par le lot `useMyReactions` de la page. */
  mine: ReactionType | null
  /**
   * Le lot de reactions du membre est encore en vol. Le TOTAL, lui, est deja
   * connu (il vient de la ligne) : on l'affiche tout de suite, seul l'etat
   * « ma reaction » reste indetermine, et le groupe le signale.
   */
  loading?: boolean
}

/**
 * Reactions d'une carte du FIL.
 *
 * POURQUOI PAS `<ReactionBar>` ICI : sa documentation l'interdit explicitement
 * dans une liste — elle s'appuie sur `useReactionSummary`, soit six requetes
 * par publication (plus de cent pour une page de vingt). Cette barre affiche
 * donc le TOTAL deja present sur la ligne et la reaction du membre venue d'un
 * lot unique ; la repartition par type, elle, n'apparait que sur la page de
 * detail, ou elle est reellement comptee. Aucun chiffre n'est estime.
 */
export function PostReactions({ postId, total, mine, loading = false }: PostReactionsProps) {
  const toast = useToast()
  const { user, isSuspended } = useAuth()
  const promptLogin = useLoginPrompt()
  const reduceMotion = useReduceMotion()
  const react = usePostQuickReaction()

  // Pendant l'aller-retour, on montre l'etat VISE : la pastille repond tout de
  // suite sur un reseau lent. En cas d'echec, l'etat du serveur reprend la main.
  const pending = react.isPending ? react.variables : undefined
  const active = pending
    ? pending.current === pending.reaction
      ? null
      : pending.reaction
    : mine

  function handleClick(reaction: ReactionType) {
    if (!user) {
      promptLogin('Connectez-vous pour reagir', 'Les reactions sont reservees aux membres.')
      return
    }

    const isMine = mine === reaction

    // Un compte suspendu peut RETIRER sa reaction mais pas en poser une
    // nouvelle (policies insert / delete de la table `reactions`).
    if (isSuspended && !isMine) {
      toast.error(
        'Compte suspendu',
        'Vous ne pouvez pas reagir tant que votre compte est suspendu.',
      )
      return
    }

    react.mutate(
      { postId, reaction, current: mine },
      {
        onError: (error) => toast.error('Reaction impossible', readableError(error)),
      },
    )
  }

  return (
    <div className={s.row}>
      <div
        className={cx(s.bar, 'scroll-x')}
        role="group"
        aria-label="Reagir a cette publication"
        aria-busy={loading || react.isPending || undefined}
      >
        {REACTIONS.map((reaction) => {
          const selected = active === reaction.value
          return (
            <motion.button
              key={reaction.value}
              type="button"
              className={cx(s.pill, selected && s.isMine)}
              onClick={() => handleClick(reaction.value)}
              aria-pressed={selected}
              aria-label={reaction.label}
              title={reaction.label}
              whileTap={reduceMotion ? undefined : { scale: 0.92 }}
            >
              <span className={s.emoji} aria-hidden="true">
                {reaction.emoji}
              </span>
            </motion.button>
          )
        })}
      </div>

      <p className={s.total}>
        {total > 0 ? `${formatCount(total)} reaction${total > 1 ? 's' : ''}` : 'Aucune reaction'}
      </p>
    </div>
  )
}
