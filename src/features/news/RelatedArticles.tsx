import { Icon } from '@/components/ui'
import type { NewsCategory, NewsListItem } from '@/services/news'
import { NewsCard, NewsCardSkeleton } from './NewsCard'
import s from './RelatedArticles.module.css'

export interface RelatedArticlesProps {
  articles: NewsListItem[] | undefined
  isLoading: boolean
  error: unknown
  /** Categorie de l'article courant, pour nommer la section honnetement. */
  category: NewsCategory | null
}

/**
 * Articles de la meme categorie.
 *
 * Bloc secondaire : quand il n'y a rien a montrer, il disparait au lieu
 * d'afficher un vide sur une page qui, elle, a du contenu.
 */
export function RelatedArticles({ articles, isLoading, error, category }: RelatedArticlesProps) {
  if (error) {
    return (
      <p className={s.unavailable} role="note">
        <Icon name="alert" size={16} />
        <span>Les articles lies n'ont pas pu etre charges.</span>
      </p>
    )
  }

  if (isLoading) {
    return (
      <section className={s.wrap} aria-busy="true">
        <h2 className={s.title}>A lire aussi</h2>
        <ul className={s.grid}>
          {[0, 1, 2].map((key) => (
            <li key={key}>
              <NewsCardSkeleton compact />
            </li>
          ))}
        </ul>
      </section>
    )
  }

  if (!articles || articles.length === 0) return null

  return (
    <section className={s.wrap} aria-labelledby="articles-lies">
      <h2 className={s.title} id="articles-lies">
        A lire aussi
        {category ? <span className={s.scope}>{category.label}</span> : null}
      </h2>

      <ul className={s.grid}>
        {articles.map((article) => (
          <li key={article.id}>
            <NewsCard article={article} category={category} compact />
          </li>
        ))}
      </ul>
    </section>
  )
}
