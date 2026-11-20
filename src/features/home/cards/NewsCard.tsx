import { Badge, Card, Icon, asBadgeTone } from '@/components/ui'
import { RELIABILITY_LABELS } from '@/lib/constants'
import { relativeTime, truncate } from '@/lib/format'
import type { NewsListItem } from '@/services/news'
import { CoverArt } from '../CoverArt'
import s from './NewsCard.module.css'

export interface NewsCardProps {
  article: NewsListItem
  /** Libelle de categorie deja resolu : la carte ne requete rien elle-meme. */
  categoryLabel?: string
}

/**
 * Carte d'actualite.
 *
 * Le niveau de fiabilite est TOUJOURS affiche : une rumeur doit se presenter
 * comme une rumeur, y compris dans une vignette d'accueil.
 */
export function NewsCard({ article, categoryLabel }: NewsCardProps) {
  const reliability = RELIABILITY_LABELS[article.reliability]
  const date = article.published_at ?? article.created_at

  return (
    <Card to={`/actualites/${article.slug}`} padding="none" className={s.card}>
      <CoverArt
        src={article.cover_url}
        seed={article.id}
        icon="news"
        ratio="wide"
        className={s.cover}
      />

      <div className={s.body}>
        <div className={s.meta}>
          <Badge tone={asBadgeTone(reliability.tone)} size="sm" title={reliability.help}>
            {reliability.label}
          </Badge>
          {categoryLabel ? (
            <span className={s.category}>{categoryLabel}</span>
          ) : null}
        </div>

        <h3 className={s.title}>{article.title}</h3>

        {article.excerpt ? (
          <p className={s.excerpt}>{truncate(article.excerpt, 120)}</p>
        ) : null}

        <p className={s.foot}>
          <Icon name="clock" size={14} />
          <span>{relativeTime(date)}</span>
          {article.source_name ? (
            <>
              <span className={s.dot} aria-hidden="true">·</span>
              <span className={s.source}>{article.source_name}</span>
            </>
          ) : null}
        </p>
      </div>
    </Card>
  )
}
