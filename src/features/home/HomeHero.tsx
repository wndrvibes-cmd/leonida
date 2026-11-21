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

      <div className={s.scrim} aria-hidden="true" />

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
      <span className={s.sun} />
      <span className={s.sea} />
      <span className={s.shimmer} />
      <svg className={s.palms} viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M34 120V62c-9-6-18-7-26-4 7-9 17-12 26-9V44c-8-8-18-11-28-9 9-8 20-9 28-5-3-9-1-16 5-21 3 7 4 14 2 21 8-6 18-7 27 1-10-1-19 2-27 9v6c9-4 19-2 27 6-9-3-18-2-27 4-1 1-2 2-3 2v62z"
        />
        <path
          d="M352 120V74c-7-5-15-6-22-3 6-8 14-10 22-8v-7c-7-7-15-9-23-7 7-7 17-8 23-4-2-8-1-13 4-18 3 6 4 12 2 18 7-5 15-6 23 1-9-1-16 2-23 7v5c8-3 16-1 23 5-8-2-15-1-23 4v33z"
        />
      </svg>
    </div>
  )
}
