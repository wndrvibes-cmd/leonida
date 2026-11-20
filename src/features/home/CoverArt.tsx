import { useState } from 'react'
import { Icon, cx, type IconName } from '@/components/ui'
import s from './CoverArt.module.css'

export type CoverRatio = 'wide' | 'card' | 'square'

export interface CoverArtProps {
  /** Visuel reel. `null` est le cas le plus courant tant que la base est vide. */
  src: string | null | undefined
  /** Texte alternatif : vide si l'image est purement decorative. */
  alt?: string
  /** Icone affichee a la place de l'image absente. */
  icon?: IconName
  /** Sert a choisir un degrade stable pour un meme contenu. */
  seed?: string
  ratio?: CoverRatio
  className?: string
}

const TINTS = ['surf', 'sunset', 'palm'] as const

/** Degrade stable pour un identifiant donne : la carte ne change pas de teinte
    a chaque rendu, et deux cartes voisines ne se ressemblent pas. */
function tintFor(seed: string | undefined): (typeof TINTS)[number] {
  if (!seed) return 'surf'
  let total = 0
  for (let i = 0; i < seed.length; i += 1) total += seed.charCodeAt(i)
  return TINTS[total % TINTS.length]
}

/**
 * Visuel de carte.
 *
 * SANS image, on affiche un degrade tropical derive des jetons : jamais une
 * fausse capture du jeu, jamais une image empruntee. Si le fichier televerse
 * ne se charge pas, on retombe sur le meme degrade plutot que sur une icone
 * de media casse.
 */
export function CoverArt({
  src,
  alt = '',
  icon = 'image',
  seed,
  ratio = 'wide',
  className,
}: CoverArtProps) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(src) && !failed

  return (
    <div className={cx(s.frame, s[ratio], className)} data-tint={tintFor(seed)}>
      {showImage && src ? (
        <img
          className={s.image}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={s.fallback}>
          <Icon name={icon} size={26} />
        </span>
      )}
    </div>
  )
}
