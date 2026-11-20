import { useId } from 'react'
import s from './Logo.module.css'

export type LogoVariant = 'full' | 'mark' | 'wordmark'

/** Boites de dessin par variante : le rapport largeur/hauteur est fixe. */
const BOX: Record<LogoVariant, { w: number; h: number }> = {
  full:     { w: 204, h: 44 },
  mark:     { w: 44,  h: 44 },
  wordmark: { w: 152, h: 44 },
}

export interface LogoProps {
  /** Hauteur rendue, en pixels. La largeur suit le rapport de la variante. */
  size?: number
  variant?: LogoVariant
  /** Texte alternatif. Mettre `null` pour une icone purement decorative. */
  label?: string | null
  className?: string
}

/**
 * Logo LEONIDA.
 *
 * Le symbole est un soleil a demi couche sur une ligne d'horizon, avec deux
 * reflets sur l'eau : l'identite de la Floride (ocean turquoise, soleil orange)
 * en quatre traits, sans aucune allusion visuelle au jeu lui-meme.
 *
 * Le mot-symbole est du texte SVG a largeur verrouillee (`lengthAdjust`
 * ajuste l'espacement, pas la forme des lettres) : le logo garde donc
 * exactement la meme emprise quelle que soit la police reellement disponible.
 */
export function Logo({ size = 28, variant = 'full', label = 'LEONIDA', className }: LogoProps) {
  const uid = useId().replace(/:/g, '')
  const box = BOX[variant]
  const width = Math.round((box.w / box.h) * size)

  const sun = `${uid}-sun`
  const sea = `${uid}-sea`
  const line = `${uid}-line`

  const showMark = variant !== 'wordmark'
  const showWord = variant !== 'mark'
  const wordX = variant === 'full' ? 58 : 4

  return (
    <svg
      className={className ? `${s.root} ${className}` : s.root}
      width={width}
      height={size}
      viewBox={`0 0 ${box.w} ${box.h}`}
      role={label ? 'img' : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <defs>
        <linearGradient id={sun} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--sand)" />
          <stop offset="45%" stopColor="var(--sunset)" />
          <stop offset="100%" stopColor="var(--sunset-700)" />
        </linearGradient>
        <linearGradient id={line} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--surf-700)" />
          <stop offset="50%" stopColor="var(--surf-300)" />
          <stop offset="100%" stopColor="var(--surf-700)" />
        </linearGradient>
        {/* Le soleil est coupe net par l'horizon : il se couche. */}
        <clipPath id={sea}>
          <rect x="0" y="0" width="44" height="24.6" />
        </clipPath>
      </defs>

      {showMark && (
        <g>
          <circle cx="22" cy="24.6" r="10.6" fill={`url(#${sun})`} clipPath={`url(#${sea})`} />
          <path d="M4 25.6h36" stroke={`url(#${line})`} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M9.5 31.6h25" stroke="var(--surf)" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
          <path d="M15 37h14" stroke="var(--surf)" strokeWidth="2" strokeLinecap="round" opacity="0.28" />
        </g>
      )}

      {showWord && (
        <>
          <text
            className={s.word}
            x={wordX}
            y="29.5"
            textLength={variant === 'full' ? 142 : 144}
            lengthAdjust="spacing"
            fill="var(--bone)"
          >
            LEONIDA
          </text>
          <path
            d={`M${wordX} 37.4h${variant === 'full' ? 142 : 144}`}
            stroke={`url(#${sun})`}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.85"
          />
        </>
      )}
    </svg>
  )
}

export default Logo
