import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Badge, Button, Card, EmptyState, ErrorState, Icon, Skeleton, Tabs, useToast,
  type IconName, type TabItem,
} from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import { useFavorites, useToggleFavorite } from '@/hooks/useFavorites'
import { formatDate } from '@/lib/format'
import { readableError } from '@/lib/supabase'
import type { FavoriteEntry } from '@/services/favorites'
import type { Database } from '@/types/database'
import s from './FavoritesScreen.module.css'

type TargetType = Database['public']['Enums']['target_type']
type TabValue = 'tous' | TargetType

interface TabDefinition {
  value: TabValue
  label: string
  icon: IconName
  /** Etat vide propre a l'onglet : on ne recycle pas un message generique. */
  empty: { title: string; description: string; to: string; cta: string }
}

const TABS: TabDefinition[] = [
  {
    value: 'tous',
    label: 'Tous',
    icon: 'bookmark',
    empty: {
      title: "Vous n'avez rien mis de cote",
      description:
        'Le bouton favori est present sur les actualites, les publications, les decouvertes de la carte et les concours. Cette liste reste privee : personne d\'autre ne la voit.',
      to: '/actualites',
      cta: 'Parcourir les actualites',
    },
  },
  {
    value: 'post',
    label: 'Publications',
    icon: 'community',
    empty: {
      title: 'Aucune publication en favori',
      description: 'Les discussions, astuces et moments que vous mettez de cote apparaitront ici.',
      to: '/communaute',
      cta: 'Voir la communaute',
    },
  },
  {
    value: 'news',
    label: 'Actualites',
    icon: 'news',
    empty: {
      title: 'Aucune actualite en favori',
      description: 'Mettez un article de cote pour le retrouver sans le rechercher.',
      to: '/actualites',
      cta: 'Voir les actualites',
    },
  },
  {
    value: 'marker',
    label: 'Decouvertes',
    icon: 'compass',
    empty: {
      title: 'Aucune decouverte en favori',
      description: 'Gardez sous la main les lieux et secrets que vous voulez tester en jeu.',
      to: '/carte',
      cta: 'Explorer la carte',
    },
  },
  {
    value: 'contest',
    label: 'Cadeaux',
    icon: 'gift',
    empty: {
      title: 'Aucun concours en favori',
      description: 'Suivez un concours pour ne pas en manquer la date de fin.',
      to: '/cadeaux',
      cta: 'Voir les cadeaux',
    },
  },
]

const KIND_LABELS: Record<TargetType, string> = {
  post: 'Publication',
  news: 'Actualite',
  marker: 'Decouverte',
  contest: 'Concours',
  comment: 'Commentaire',
}

const KIND_ICONS: Record<TargetType, IconName> = {
  post: 'community',
  news: 'news',
  marker: 'compass',
  contest: 'gift',
  comment: 'comment',
}

function readTab(raw: string | null): TabValue {
  const match = TABS.find((tab) => tab.value === raw)
  return match ? match.value : 'tous'
}

/** Adresse interne de la cible, ou `null` si elle n'est pas atteignable. */
function linkOf(entry: FavoriteEntry): string | null {
  const { target } = entry
  if (!target) return null

  switch (target.kind) {
    case 'post':
      return `/communaute/${target.id}`
    case 'news':
      return target.slug ? `/actualites/${target.slug}` : null
    case 'marker':
      return `/carte?decouverte=${target.id}`
    case 'contest':
      return target.slug ? `/cadeaux/${target.slug}` : null
    case 'comment':
      // Le fil d'origine d'un commentaire n'est pas resolu par le service :
      // mieux vaut aucun lien qu'un lien qui ne mene nulle part.
      return null
    default:
      return null
  }
}

/* -------------------------------------------------------------------------- */

function FavoriteRow({ entry }: { entry: FavoriteEntry }) {
  const toast = useToast()
  const kind = entry.favorite.target_type
  const toggle = useToggleFavorite(kind, entry.favorite.target_id)

  const href = linkOf(entry)
  const title = entry.target?.title ?? null

  function remove() {
    toggle.mutate(undefined, {
      onSuccess: (stillFavorite) => {
        if (!stillFavorite) toast.success('Retire de vos favoris')
      },
      onError: (error) => {
        toast.error('Retrait impossible', readableError(error))
      },
    })
  }

  return (
    <Card as="li" variant="flat" padding="md" className={s.row}>
      <span className={s.rowIcon} aria-hidden="true">
        <Icon name={KIND_ICONS[kind]} size={18} />
      </span>

      <div className={s.rowBody}>
        <div className={s.rowHead}>
          <Badge tone="neutral" size="sm">
            {KIND_LABELS[kind]}
          </Badge>
          <span className={s.rowDate}>
            Enregistre le{' '}
            <time dateTime={entry.favorite.created_at}>{formatDate(entry.favorite.created_at)}</time>
          </span>
        </div>

        {href && title ? (
          <h3 className={s.rowTitle}>
            <Link to={href} className={s.rowLink}>
              {title}
            </Link>
          </h3>
        ) : (
          <>
            <h3 className={s.rowTitle}>{title ?? 'Contenu indisponible'}</h3>
            <p className={s.rowNote}>
              {kind === 'comment'
                ? "Ce commentaire est bien enregistre, mais son fil d'origine n'est pas encore retrouve ici : il n'y a donc aucun lien a proposer."
                : "Ce contenu a ete supprime ou masque par la moderation. Il n'est plus consultable ; vous pouvez retirer ce favori."}
            </p>
          </>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={remove}
        loading={toggle.isPending}
        iconLeft={<Icon name="close" size={16} />}
      >
        Retirer
      </Button>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */

/**
 * Mes favoris.
 *
 * Liste strictement PRIVEE (policy `favorites_own`). Le retrait reutilise
 * `useToggleFavorite` : l'etat ecrit est celui confirme par la base.
 *
 * POURQUOI PAS `<FavoriteButton>` ICI : ce bouton interroge l'etat du favori
 * ligne par ligne (`useIsFavorite`). Sur cette page, l'etat est deja connu —
 * tout ce qui est liste EST un favori — et vingt lignes signifieraient vingt
 * requetes inutiles.
 */
export function FavoritesScreen() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const tab = readTab(params.get('type'))

  const definition = TABS.find((item) => item.value === tab) ?? TABS[0]
  const query = useFavorites(tab === 'tous' ? undefined : tab)

  const selectTab = useCallback(
    (next: string) => {
      setParams(
        (previous) => {
          const copy = new URLSearchParams(previous)
          if (next === 'tous') copy.delete('type')
          else copy.set('type', next)
          return copy
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const items: TabItem[] = TABS.map((item) => ({
    value: item.value,
    label: item.label,
    icon: <Icon name={item.icon} size={16} />,
  }))

  const entries = query.data ?? []

  return (
    <section className={`${s.page} page`}>
      <header className={s.head}>
        <p className={s.kicker}>
          <Icon name="bookmark" size={14} />
          Prive
        </p>
        <h1 className={s.title}>Mes favoris</h1>
        <p className={s.lead}>
          Tout ce que vous mettez de cote, au meme endroit. Cette liste n'apparait sur
          aucun profil : vous seul la voyez.
        </p>
      </header>

      <Tabs items={items} value={tab} onChange={selectTab} ariaLabel="Type de favori" />

      {!user ? (
        <EmptyState
          title="Connectez-vous pour retrouver vos favoris"
          description="Vos favoris sont attaches a votre compte et ne quittent jamais votre session."
          action={
            <Button as="link" to="/connexion" variant="primary">
              Se connecter
            </Button>
          }
        />
      ) : query.isPending ? (
        <div className={s.list} aria-busy="true">
          <Skeleton height={86} radius="lg" />
          <Skeleton height={86} radius="lg" />
          <Skeleton height={86} radius="lg" />
        </div>
      ) : query.isError ? (
        <ErrorState
          error={query.error}
          title="Favoris indisponibles"
          onRetry={() => void query.refetch()}
        />
      ) : entries.length === 0 ? (
        <EmptyState
          illustration={<Icon name={definition.icon} size={38} />}
          title={definition.empty.title}
          description={definition.empty.description}
          action={
            <Button as="link" to={definition.empty.to} variant="secondary">
              {definition.empty.cta}
            </Button>
          }
        />
      ) : (
        <ul className={s.list}>
          {entries.map((entry) => (
            <FavoriteRow
              key={`${entry.favorite.target_type}:${entry.favorite.target_id}`}
              entry={entry}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

export default FavoritesScreen
