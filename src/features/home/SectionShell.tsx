import type { ReactNode } from 'react'
import { Link, type To } from 'react-router-dom'
import { Button, EmptyState, ErrorState, Icon, cx, type IconName } from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import s from './SectionShell.module.css'

export interface SectionShellProps {
  icon: IconName
  /** Titre venu du reglage `home.sections`, avec repli cote section. */
  title: string
  subtitle?: string
  /** Destination du lien « tout voir ». */
  to?: To
  linkLabel?: string
  children: ReactNode
}

/** En-tete + corps d'une section d'accueil. Aucune donnee, seulement la mise en page. */
export function SectionShell({ icon, title, subtitle, to, linkLabel, children }: SectionShellProps) {
  return (
    <section className={s.section}>
      <div className={cx('page', s.head)}>
        <div className={s.heading}>
          <span className={s.icon} aria-hidden="true">
            <Icon name={icon} size={18} />
          </span>
          <div>
            <h2 className={s.title}>{title}</h2>
            {subtitle ? <p className={s.subtitle}>{subtitle}</p> : null}
          </div>
        </div>

        {to ? (
          <Link className={s.more} to={to}>
            {linkLabel ?? 'Tout voir'}
            <Icon name="chevron-right" size={16} />
          </Link>
        ) : null}
      </div>

      <div className={cx('page', s.body)}>{children}</div>
    </section>
  )
}

/* ========================================================================= */

export interface SectionEmptyHint {
  title: string
  description: string
  icon?: IconName
  /** Raccourci d'administration, affiche uniquement a l'equipe. */
  adminTo?: string
  adminLabel?: string
}

export interface SectionBodyProps {
  isLoading: boolean
  isError: boolean
  error: unknown
  onRetry: () => void
  isEmpty: boolean
  /** Facultatif : une section sans liste (carte, assistant, LEONIDA+) ne
      connait pas d'etat vide. */
  empty?: SectionEmptyHint
  /** Squelette propre a la section (memes dimensions que son contenu reel). */
  skeleton: ReactNode
  children: ReactNode
}

/**
 * Les quatre etats d'une section, dans l'ordre de priorite : chargement,
 * erreur, vide, contenu.
 *
 * L'etat vide est le plus important aujourd'hui : la base est vide, c'est donc
 * ce que verra un visiteur. Pour un membre de l'equipe, il propose en plus le
 * raccourci vers l'ecran d'administration qui permet de la remplir.
 */
export function SectionBody({
  isLoading, isError, error, onRetry, isEmpty, empty, skeleton, children,
}: SectionBodyProps) {
  const { isStaff } = useAuth()

  if (isLoading) return <>{skeleton}</>

  if (isError) {
    return <ErrorState error={error} onRetry={onRetry} compact />
  }

  if (isEmpty && empty) {
    return (
      <EmptyState
        compact
        title={empty.title}
        description={empty.description}
        illustration={
          empty.icon ? (
            <span className={s.emptyIcon} aria-hidden="true">
              <Icon name={empty.icon} size={28} />
            </span>
          ) : undefined
        }
        action={
          isStaff && empty.adminTo && empty.adminLabel ? (
            <Button
              as="link"
              to={empty.adminTo}
              variant="secondary"
              size="sm"
              iconLeft={<Icon name="shield" size={16} />}
            >
              {empty.adminLabel}
            </Button>
          ) : undefined
        }
      />
    )
  }

  return <>{children}</>
}
