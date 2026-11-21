import { useMemo } from 'react'
import { Button, EmptyState, ErrorState, Icon, Skeleton, cx } from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import { useHomeHero, useHomeSections } from '@/hooks/useAppSettings'
import type { HomeSection } from '@/services/settings'
import { DEFAULT_HOME_SECTIONS, isHomeSectionKey } from './constants'
import { FeaturedHomeArticle } from './FeaturedHomeArticle'
import type { SectionDensity } from './SectionShell'
import { HomeHero } from './HomeHero'
import { Reveal } from './Reveal'
import { RowSkeleton } from './SectionRow'
import { AiSection } from './sections/AiSection'
import { CommunitySection } from './sections/CommunitySection'
import { ContestsSection } from './sections/ContestsSection'
import { DiscoveriesSection } from './sections/DiscoveriesSection'
import { MapSection } from './sections/MapSection'
import { MomentsSection } from './sections/MomentsSection'
import { NewsSection } from './sections/NewsSection'
import { PremiumSection } from './sections/PremiumSection'
import s from './HomeScreen.module.css'

/** Titres de repli si l'administrateur a laisse le libelle vide. */
const FALLBACK_TITLES: Record<string, string> = {
  news: 'Actualités récentes',
  discoveries: 'Dernières découvertes',
  community: 'La communauté',
  moments: 'Moments populaires',
  map: 'Explorer la carte',
  contests: 'Concours et cadeaux',
  ai: 'LEONIDA AI',
  premium: 'LEONIDA+',
}

/**
 * Une section d'accueil, choisie par sa cle.
 *
 * Chaque section lance SA PROPRE requete : elles partent donc toutes en
 * parallele, et une cle inconnue (ajoutee en base plus tard) est simplement
 * ignoree au lieu de casser la page.
 */
/**
 * Densite de chaque rubrique.
 *
 * C'est ici que se joue le rythme de l'accueil : les rubriques de contenu
 * vivant respirent, les acces secondaires se font discrets. Sans cette
 * alternance, la page redevient une pile de blocs identiques.
 */
const SECTION_DENSITY: Record<string, SectionDensity> = {
  news: 'major',
  community: 'major',
  moments: 'major',
  discoveries: 'default',
  map: 'default',
  contests: 'default',
  ai: 'minor',
  premium: 'minor',
}

function HomeSectionByKey({ section }: { section: HomeSection }) {
  const title = section.label.trim() || FALLBACK_TITLES[section.key] || section.key
  const density = SECTION_DENSITY[section.key] ?? 'default'

  switch (section.key) {
    case 'news':        return <NewsSection title={title} density={density} />
    case 'discoveries': return <DiscoveriesSection title={title} density={density} />
    case 'community':   return <CommunitySection title={title} density={density} />
    case 'moments':     return <MomentsSection title={title} density={density} />
    case 'map':         return <MapSection title={title} density={density} />
    case 'contests':    return <ContestsSection title={title} density={density} />
    case 'ai':          return <AiSection title={title} density={density} />
    case 'premium':     return <PremiumSection title={title} density={density} />
    default:            return null
  }
}

/**
 * Squelette de l'accueil pendant la lecture de `home.sections`.
 *
 * COMPROMIS ASSUME : on attend de connaitre les sections activees avant de
 * lancer leurs requetes. Cela coute un aller-retour (le reglage est minuscule
 * et mis en cache 5 minutes), mais evite d'afficher brievement une section
 * qu'un administrateur a justement desactivee.
 */
function HomeSkeleton() {
  return (
    <div aria-busy="true">
      {[0, 1, 2].map((index) => (
        <section key={index} className={s.skeletonSection}>
          <div className={cx('page', s.skeletonHead)}>
            <Skeleton width={36} height={36} radius="md" />
            <Skeleton width="min(28ch, 60%)" height="1.4rem" />
          </div>
          <div className="page">
            <RowSkeleton count={3} />
          </div>
        </section>
      ))}
    </div>
  )
}

export default function HomeScreen() {
  const { isStaff } = useAuth()
  const hero = useHomeHero()
  const sections = useHomeSections()

  // `home.hero` et `home.sections` sortent de la MEME requete (meme cle de
  // cache dans useAppSettings) : un seul appel reseau pour les deux.
  const visible = useMemo<HomeSection[]>(() => {
    const configured = sections.data ?? []
    // Reglage absent ou illisible : on retombe sur l'ordre livre par la
    // migration 0007 plutot que sur une page vide.
    const list = configured.length > 0 ? configured : DEFAULT_HOME_SECTIONS
    return list.filter((section) => section.enabled && isHomeSectionKey(section.key))
  }, [sections.data])

  if (sections.isError) {
    return (
      <div className={cx('page', s.state)}>
        <ErrorState
          error={sections.error}
          title="L'accueil n'a pas pu être charge"
          onRetry={() => void sections.refetch()}
        />
      </div>
    )
  }

  return (
    <div className={s.screen}>
      <HomeHero hero={hero.data} isLoading={hero.isPending} />

      {/* Temps fort editorial, juste apres la banniere. Ne rend rien tant
          qu'aucune actualite n'est publiee : un bloc vide de cette taille
          donnerait l'impression d'une application a l'abandon. */}
      {visible.some((section) => section.key === 'news') ? <FeaturedHomeArticle /> : null}

      {sections.isPending ? (
        <HomeSkeleton />
      ) : visible.length === 0 ? (
        <div className={cx('page', s.state)}>
          <EmptyState
            title="L'accueil est en cours de configuration"
            description="Aucune section n'est activee pour le moment. Les rubriques restent accessibles depuis la navigation."
            action={
              isStaff ? (
                <Button
                  as="link"
                  to="/admin/reglages"
                  variant="secondary"
                  size="sm"
                  iconLeft={<Icon name="shield" size={16} />}
                >
                  Configurer l'accueil
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        visible.map((section, index) => (
          <Reveal key={section.key} delay={Math.min(index, 3) * 0.06}>
            <HomeSectionByKey section={section} />
          </Reveal>
        ))
      )}
    </div>
  )
}
