/**
 * Page d'accueil de LEONIDA.
 *
 * Point d'entree unique : `src/pages/HomePage.tsx` ne monte que `HomeScreen`.
 * Les sections sont pilotees par les reglages `home.hero` et `home.sections`,
 * et chacune lit de vraies donnees via `src/services/`.
 */

export { default as HomeScreen } from './HomeScreen'

export { HomeHero } from './HomeHero'
export type { HomeHeroProps } from './HomeHero'

export { Reveal } from './Reveal'
export type { RevealProps } from './Reveal'

export { CoverArt } from './CoverArt'
export type { CoverArtProps, CoverRatio } from './CoverArt'

export { PitchCard } from './PitchCard'
export type { PitchCardProps } from './PitchCard'

export { SectionBody, SectionShell } from './SectionShell'
export type { SectionBodyProps, SectionEmptyHint, SectionShellProps } from './SectionShell'

export { RowSkeleton, SectionRow, SectionRowItem } from './SectionRow'
export type { RowSize, RowSkeletonProps, SectionRowProps } from './SectionRow'

export { NewsCard } from './cards/NewsCard'
export type { NewsCardProps } from './cards/NewsCard'

export { DiscoveryCard } from './cards/DiscoveryCard'
export type { DiscoveryCardProps } from './cards/DiscoveryCard'

export { PostCard } from './cards/PostCard'
export type { PostCardProps } from './cards/PostCard'

export { MomentCard } from './cards/MomentCard'
export type { MomentCardProps } from './cards/MomentCard'

export { ContestCard } from './cards/ContestCard'
export type { ContestCardProps } from './cards/ContestCard'

export {
  DEFAULT_HOME_SECTIONS, HOME_LIMITS, HOME_SECTION_KEYS, isHomeSectionKey, markerIcon,
} from './constants'
export type { HomeSectionKey } from './constants'
