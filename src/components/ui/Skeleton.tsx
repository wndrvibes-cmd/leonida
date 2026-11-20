import { cx } from './cx'
import s from './Skeleton.module.css'

export type SkeletonRadius = 'sm' | 'md' | 'lg' | 'full'

export interface SkeletonProps {
  /** Largeur CSS : « 100% », « 12ch », 240... */
  width?: string | number
  height?: string | number
  radius?: SkeletonRadius
  /** Rend plusieurs lignes de texte, la derniere plus courte. */
  lines?: number
  className?: string
}

export function Skeleton({ width, height, radius = 'md', lines, className }: SkeletonProps) {
  if (lines && lines > 1) {
    return (
      <div className={cx(s.stack, className)} aria-hidden="true">
        {Array.from({ length: lines }, (_, index) => (
          <span
            key={index}
            className={cx(s.block, s[radius], index === lines - 1 && s.short)}
            style={{ height: height ?? '0.9em' }}
          />
        ))}
      </div>
    )
  }

  return (
    <span
      className={cx(s.block, s[radius], className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

/** Cercle de chargement aux dimensions d'un avatar. */
export function SkeletonAvatar({ size = 44, className }: { size?: number; className?: string }) {
  return <Skeleton width={size} height={size} radius="full" className={className} />
}
