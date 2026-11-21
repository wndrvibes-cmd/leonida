import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Badge, Icon, Skeleton, asBadgeTone } from '@/components/ui'
import { useReduceMotion } from '@/app/motionPreference'
import { fadeUp, VIEWPORT_ONCE } from '@/app/motion'
import { RELIABILITY_LABELS } from '@/lib/constants'
import { formatDate, truncate } from '@/lib/format'
import { CoverArt } from './CoverArt'
import type { NewsListItem } from '@/services/news'
import s from './FeaturedArticle.module.css'

export interface FeaturedArticleProps {
  article: NewsListItem | null | undefined
  categoryLabel?: string
  isLoading?: boolean
}

/**
 * Actualite principale : le premier temps fort apres la banniere.
 *
 * POURQUOI UNE PIECE A PART : un carrousel traite toutes les actualites a
 * egalite. Une page editoriale, elle, designe un sujet. Ce bloc occupe toute
 * la largeur, donne a l'image une vraie surface et fait respirer le titre —
 * c'est lui qui installe la hierarchie de l'accueil.
 *
 * S'il n'y a RIEN a mettre en avant, ce composant ne rend rien du tout : un
 * emplacement vide de cette taille donnerait l'impression d'une application
 * abandonnee. L'etat vide est porte par la section « Actualites recentes »,
 * qui sait l'exprimer en une ligne.
 */
export function FeaturedArticle({ article, categoryLabel, isLoading }: FeaturedArticleProps) {
  const reduceMotion = useReduceMotion()

  if (isLoading) {
    return (
      <div className={`page ${s.wrap}`}>
        <div className={s.card}>
          <Skeleton className={s.mediaSkeleton} radius="lg" />
          <div className={s.textSkeleton}>
            <Skeleton width="30%" height="1rem" />
            <Skeleton width="90%" height="2rem" />
            <Skeleton width="100%" height="1rem" lines={2} />
          </div>
        </div>
      </div>
    )
  }

  if (!article) return null

  const reliability = RELIABILITY_LABELS[article.reliability]
  const Wrapper = reduceMotion ? 'div' : motion.div

  return (
    <div className={`page ${s.wrap}`}>
      <Wrapper
        className={s.card}
        {...(reduceMotion
          ? {}
          : { variants: fadeUp, initial: 'hidden', whileInView: 'visible', viewport: VIEWPORT_ONCE })}
      >
        <Link to={`/actualites/${article.slug}`} className={s.media} tabIndex={-1} aria-hidden="true">
          <CoverArt src={article.cover_url} seed={article.id} ratio="wide" icon="news" />
        </Link>

        <div className={s.body}>
          <div className={s.tags}>
            <Badge tone="accent" size="sm">À la une</Badge>
            {categoryLabel ? <Badge tone="neutral" size="sm">{categoryLabel}</Badge> : null}
            {/* La fiabilite suit l'article partout, y compris ici : une rumeur
                mise en avant doit rester identifiee comme une rumeur. */}
            <Badge tone={asBadgeTone(reliability.tone)} size="sm">{reliability.label}</Badge>
          </div>

          <h2 className={s.title}>
            <Link to={`/actualites/${article.slug}`} className={s.titleLink}>
              {article.title}
            </Link>
          </h2>

          {article.excerpt ? (
            <p className={s.excerpt}>{truncate(article.excerpt, 240)}</p>
          ) : null}

          <div className={s.foot}>
            {article.published_at ? (
              <span className={s.date}>{formatDate(article.published_at)}</span>
            ) : null}
            {article.source_name ? (
              <span className={s.source}>
                <Icon name="external" size={13} /> {article.source_name}
              </span>
            ) : null}
            <span className={s.cta}>
              Lire l'article <Icon name="arrow-right" size={15} />
            </span>
          </div>
        </div>
      </Wrapper>
    </div>
  )
}

export default FeaturedArticle
