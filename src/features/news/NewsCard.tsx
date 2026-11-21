import { Card, cx, Icon, Skeleton } from '@/components/ui'
import { formatDate, relativeTime, truncate } from '@/lib/format'
import { publicUrl } from '@/lib/supabase'
import type { NewsCategory, NewsListItem } from '@/services/news'
import { asCategoryAccent } from './categories'
import { ReliabilityBadge } from './ReliabilityBadge'
import s from './NewsCard.module.css'

export interface NewsCardProps {
  article: NewsListItem
  /** Categorie resolue par l'appelant. `null` = article sans categorie. */
  category?: NewsCategory | null
  /** Variante dense, utilisee par les articles lies. */
  compact?: boolean
  /**
   * Mise en avant editoriale : la carte occupe deux colonnes et bascule en
   * composition horizontale. Reservee au PREMIER article d'une liste — au-dela,
   * plus rien ne se detache et on retombe sur une grille uniforme.
   */
  featured?: boolean
}

/**
 * Carte d'actualite.
 *
 * La carte entiere est un lien : aucun autre lien ne peut donc etre imbrique
 * ici (le nom de la source est affiche en texte, le lien sortant vit sur la
 * page de l'article).
 *
 * `view_count` n'est volontairement pas affiche : la base n'autorise son
 * incrementation qu'au staff, le compteur ne mesure donc pas l'audience.
 */
export function NewsCard({ article, category, compact = false, featured = false }: NewsCardProps) {
  const cover = publicUrl('news', article.cover_url)
  const isRumor = article.reliability === 'rumor'
  const accent = asCategoryAccent(category?.accent)

  return (
    <Card
      to={`/actualites/${article.slug}`}
      padding="none"
      className={cx(s.card, compact && s.compact, featured && s.featured, isRumor && s.rumor)}
    >
      <div className={s.cover}>
        {cover ? (
          <img className={s.image} src={cover} alt="" loading="lazy" decoding="async" />
        ) : (
          <span className={s.placeholder} aria-hidden="true">
            <Icon name="news" size={compact ? 22 : 28} />
          </span>
        )}
      </div>

      <div className={s.body}>
        <div className={s.meta}>
          {category ? (
            <span className={cx(s.category, s[accent])}>{category.label}</span>
          ) : null}
          <ReliabilityBadge reliability={article.reliability} size="sm" />
        </div>

        <h3 className={s.title}>{article.title}</h3>

        {article.excerpt ? (
          <p className={s.excerpt}>{truncate(article.excerpt, compact ? 90 : 160)}</p>
        ) : null}

        <div className={s.foot}>
          {article.published_at ? (
            <time
              className={s.date}
              dateTime={article.published_at}
              title={formatDate(article.published_at, true)}
            >
              {relativeTime(article.published_at)}
            </time>
          ) : (
            <span className={cx(s.date, s.undated)}>Date non precisee</span>
          )}

          {article.source_name ? (
            <span className={s.source} title={`Source : ${article.source_name}`}>
              <Icon name="external" size={13} />
              {article.source_name}
            </span>
          ) : null}
        </div>
      </div>
    </Card>
  )
}

/** Meme gabarit que la carte, pour que la liste ne saute pas au chargement. */
export function NewsCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cx(s.card, s.skeleton, compact && s.compact)} aria-hidden="true">
      <div className={s.cover}>
        <Skeleton width="100%" height="100%" radius="md" />
      </div>
      <div className={s.body}>
        <Skeleton width="38%" height={20} radius="full" />
        <Skeleton lines={2} height="1.1em" />
        <Skeleton width="55%" height="0.9em" />
      </div>
    </div>
  )
}
