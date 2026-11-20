import type { ReactNode } from 'react'
import { Skeleton, cx } from '@/components/ui'
import s from './SectionRow.module.css'

export type RowSize = 'sm' | 'md' | 'lg'

export interface SectionRowProps {
  children: ReactNode
  /** Largeur des cartes sur mobile et densite de la grille sur grand ecran. */
  size?: RowSize
  ariaLabel?: string
}

/**
 * Rangee de cartes : carrousel « snap » sur mobile, grille sur grand ecran.
 *
 * Le defilement horizontal est confine a ce conteneur (`.scroll-x`), jamais au
 * corps de la page. Au-dela de 900px la classe est volontairement redoublee
 * (`.row.row`) pour reprendre la main sur la regle globale `.snap-row`, qui
 * impose `display: flex`.
 */
export function SectionRow({ children, size = 'md', ariaLabel }: SectionRowProps) {
  return (
    <div className={cx('scroll-x', s.scroller)}>
      <ul className={cx('snap-row', s.row, s[size])} aria-label={ariaLabel}>
        {children}
      </ul>
    </div>
  )
}

export function SectionRowItem({ children }: { children: ReactNode }) {
  return <li className={s.item}>{children}</li>
}

/* ========================================================================= */

export interface RowSkeletonProps {
  count?: number
  size?: RowSize
  /** `true` pour un bloc visuel carre (moments) plutot que 16/9. */
  square?: boolean
  /** `false` pour une carte sans visuel (publications de la communaute). */
  withCover?: boolean
}

/**
 * Squelette aux memes dimensions que les cartes reelles : la mise en page ne
 * saute pas quand les donnees arrivent.
 */
export function RowSkeleton({
  count = 3, size = 'md', square = false, withCover = true,
}: RowSkeletonProps) {
  return (
    <SectionRow size={size}>
      {Array.from({ length: count }, (_, index) => (
        <SectionRowItem key={index}>
          <div className={s.skeleton} aria-hidden="true">
            {withCover ? (
              <Skeleton
                width="100%"
                height={square ? 200 : 140}
                radius="md"
                className={s.skeletonCover}
              />
            ) : null}
            <Skeleton width="70%" height="1.1rem" />
            <Skeleton lines={2} />
          </div>
        </SectionRowItem>
      ))}
    </SectionRow>
  )
}
