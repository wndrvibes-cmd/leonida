import { useState } from 'react'
import { Button, Icon, Skeleton, cx } from '@/components/ui'
import { isHeroVisible, type HomeHero as HomeHeroSetting } from '@/services/settings'
import s from './HomeHero.module.css'

export interface HomeHeroProps {
  hero: HomeHeroSetting | undefined
  isLoading: boolean
}

function isExternal(link: string): boolean {
  return /^https?:\/\//i.test(link)
}

/**
 * Banniere d'accueil, entierement pilotee par le reglage `home.hero`.
 *
 * Trois garanties :
 *   - la fenetre de programmation est respectee (`isHeroVisible`) ;
 *   - sans image televersee, le fond est un degrade tropical construit avec
 *     les jetons — jamais une capture de GTA VI, qui serait une image que nous
 *     n'avons pas le droit de presenter comme notre contenu ;
 *   - le bouton n'apparaît que si l'administrateur a renseigne A LA FOIS un
 *     libelle et une destination : pas de bouton qui ne mene nulle part.
 */
export function HomeHero({ hero, isLoading }: HomeHeroProps) {
  const [imageFailed, setImageFailed] = useState(false)

  if (isLoading) {
    return (
      <section className={cx(s.hero, s.loading)} aria-busy="true">
        <div className={cx('page', s.inner)}>
          <Skeleton width="min(22ch, 80%)" height="2.4rem" />
          <Skeleton width="min(46ch, 100%)" height="1rem" lines={2} />
          <Skeleton width={180} height={46} radius="lg" />
        </div>
      </section>
    )
  }

  // Reglage absent, desactive, ou hors de sa fenetre de dates : aucune
  // banniere. L'accueil enchaine directement sur ses sections.
  if (!hero || !isHeroVisible(hero)) return null

  const showImage = Boolean(hero.imageUrl) && !imageFailed
  const cta =
    hero.ctaLabel && hero.ctaLink ? { label: hero.ctaLabel, link: hero.ctaLink } : null

  return (
    <section className={cx(s.hero, hero.align === 'center' && s.center)}>
      <div className={s.art} aria-hidden="true">
        {showImage && hero.imageUrl ? (
          <img
            className={s.image}
            src={hero.imageUrl}
            alt=""
            onError={() => setImageFailed(true)}
            decoding="async"
          />
        ) : (
          <HorizonArt />
        )}
      </div>

      <div className={cx(s.scrim, !showImage && s.scrimArt)} aria-hidden="true" />

      <div className={cx('page', s.inner)}>
        <h1 className={s.title}>{hero.title}</h1>
        {hero.subtitle ? <p className={s.subtitle}>{hero.subtitle}</p> : null}

        {cta ? (
          <div className={s.actions}>
            {isExternal(cta.link) ? (
              <Button
                as="a"
                href={cta.link}
                target="_blank"
                rel="noreferrer noopener"
                variant="primary"
                size="lg"
                iconRight={<Icon name="external" size={18} />}
              >
                {cta.label}
              </Button>
            ) : (
              <Button
                as="link"
                to={cta.link}
                variant="primary"
                size="lg"
                iconRight={<Icon name="arrow-right" size={18} />}
              >
                {cta.label}
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}

/**
 * Horizon de Leonida en pur CSS : ciel couchant, soleil, mer turquoise et
 * silhouettes de palmiers. Les mouvements portent uniquement sur `transform`
 * et `opacity`, et leurs durees derivent des jetons `--dur-*` : le reglage
 * « reduire les animations » les met donc a zero.
 */
function HorizonArt() {
  return (
    <div className={s.horizon}>
      <span className={s.sky} />
      <span className={s.bloom} />
      <span className={s.sun} />
      <span className={s.haze} />
      <span className={s.sea} />
      <span className={s.sunpath} />
      <span className={s.shimmer} />
      <PalmSilhouette className={cx(s.palm, s.palmLeft)} />
      <PalmSilhouette className={cx(s.palm, s.palmRight)} />
      <span className={s.grain} />
    </div>
  )
}

/** Angles des palmes autour de la couronne, en degres. */
const FROND_ANGLES = [-152, -118, -84, -44, -8, 30, 68]

/**
 * Silhouette de palmier.
 *
 * Le viewBox est volontairement etroit et `preserveAspectRatio` garde sa
 * valeur par defaut : l'element est dimensionne en hauteur par le CSS et sa
 * largeur suit, donc les proportions ne peuvent pas etre ecrasees.
 */
function PalmSilhouette({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="-72 -118 144 120" aria-hidden="true" focusable="false">
      {/* tronc legerement incline, affine vers la couronne */}
      <path d="M-6 0 C-4 -32 0 -60 2 -86 L11 -86 C9 -60 6 -32 6 0 Z" />
      <g transform="translate(6 -86)">
        {FROND_ANGLES.map((angle) => (
          <path
            key={angle}
            transform={`rotate(${angle})`}
            d="M0 0 C17 -7 36 -5 53 6 C38 -2 19 -3 3 6 Z"
          />
        ))}
      </g>
      {/* regime de noix, juste sous la couronne */}
      <circle cx="3" cy="-81" r="3.2" />
      <circle cx="10" cy="-78" r="2.6" />
    </svg>
  )
}
