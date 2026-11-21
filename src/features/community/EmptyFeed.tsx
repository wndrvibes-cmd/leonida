import type { ReactNode } from 'react'
import { Button, EmptyState, Icon } from '@/components/ui'
import s from './EmptyFeed.module.css'

export interface EmptyFeedProps {
  /**
   * `start`    : la communaute n'a encore aucune publication ;
   * `filtered` : des filtres sont actifs et ne renvoient rien ;
   * `search`   : une recherche ne renvoie rien.
   */
  variant: 'start' | 'filtered' | 'search'
  /** Terme recherche, affiche tel quel dans le message. */
  query?: string
  onCompose?: () => void
  /** Explication quand la publication n'est pas possible (compte suspendu). */
  composeDisabledReason?: string | null
  onReset?: () => void
}

/**
 * Illustration de l'etat de depart : soleil couchant, ocean, palmier.
 * Uniquement des jetons de couleur, aucun fichier image a charger.
 */
function Shore() {
  return (
    <svg
      className={s.art}
      viewBox="0 0 160 120"
      role="img"
      aria-label="Un palmier au bord de l'ocean au coucher du soleil"
    >
      <circle className={s.sun} cx="104" cy="46" r="23" />
      <rect className={s.sea} x="8" y="72" width="144" height="4" rx="2" />
      <rect className={s.seaFar} x="30" y="82" width="104" height="3" rx="1.5" />
      <rect className={s.sand} x="4" y="93" width="152" height="5" rx="2.5" />
      <g className={s.palm}>
        <path d="M46 96 C46 78 42 64 35 54" />
        <path d="M35 54 C25 44 15 46 9 53" />
        <path d="M35 54 C31 40 37 31 47 29" />
        <path d="M35 54 C45 46 57 49 63 57" />
      </g>
    </svg>
  )
}

/**
 * Etats vides du fil communautaire.
 *
 * La base est vide au lancement : cet ecran est donc le PREMIER que verra un
 * membre. Il ne simule aucune publication, aucun compteur, aucun membre — il
 * explique ce qu'il y aura ici et propose la seule action utile : publier.
 */
export function EmptyFeed({
  variant,
  query,
  onCompose,
  composeDisabledReason,
  onReset,
}: EmptyFeedProps) {
  if (variant !== 'start') {
    const action: ReactNode = onReset ? (
      <Button variant="secondary" onClick={onReset} iconLeft={<Icon name="refresh" size={18} />}>
        Reinitialiser les filtres
      </Button>
    ) : null

    return variant === 'search' ? (
      <EmptyState
        illustration={<Icon name="search" size={38} />}
        title="Aucune publication ne correspond"
        description={
          query
            ? `Rien ne contient « ${query} » dans son titre ou son message. Essayez un autre mot, ou elargissez les filtres.`
            : 'Essayez un autre mot, ou elargissez les filtres.'
        }
        action={action}
      />
    ) : (
      <EmptyState
        illustration={<Icon name="filter" size={38} />}
        title="Aucune publication avec ces filtres"
        description="Personne n'a encore publié ce type de contenu, ou avec ce tag. Le fil complet, lui, vous attend."
        action={action}
      />
    )
  }

  return (
    <div className={s.start}>
      <Shore />

      <div className={s.text}>
        <p className={s.kicker}>La communauté demarre ici</p>
        <h2 className={s.title}>Aucune publication pour le moment</h2>
        <p className={s.lead}>
          Le fil est vide, et c'est normal : rien n'a encore été publié. Pas de faux
          message, pas de membre invente — la première publication sera la votre.
        </p>

        <ul className={s.ideas}>
          <li className={s.idea}>
            <Icon name="sparkles" size={18} />
            <span>
              <strong>Une astuce</strong> qui vous a fait gagner du temps dans Leonida.
            </span>
          </li>
          <li className={s.idea}>
            <Icon name="camera" size={18} />
            <span>
              <strong>Une capture</strong> d'un endroit, d'un véhicule ou d'un détail
              remarque.
            </span>
          </li>
          <li className={s.idea}>
            <Icon name="comment" size={18} />
            <span>
              <strong>Une question</strong> : quelqu'un finira par y répondre.
            </span>
          </li>
        </ul>

        <div className={s.actions}>
          <Button
            variant="primary"
            size="lg"
            onClick={onCompose}
            disabled={!onCompose || Boolean(composeDisabledReason)}
            iconLeft={<Icon name="plus" size={18} />}
          >
            Publier le premier message
          </Button>
          <Button as="link" to="/carte" variant="ghost" size="lg" iconLeft={<Icon name="map" size={18} />}>
            Explorer la carte
          </Button>
        </div>

        {composeDisabledReason ? (
          <p className={s.note} role="note">
            <Icon name="lock" size={16} />
            {composeDisabledReason}
          </p>
        ) : null}
      </div>
    </div>
  )
}
