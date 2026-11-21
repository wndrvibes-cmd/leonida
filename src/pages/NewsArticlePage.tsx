import { Link, useParams } from 'react-router-dom'
import {
  Button,
  cx,
  EmptyState,
  ErrorState,
  Icon,
  Skeleton,
} from '@/components/ui'
import {
  AuthorLine,
  CommentThread,
  FavoriteButton,
  ReactionBar,
  ReportButton,
  ShareButton,
} from '@/features/engagement'
import { formatDate } from '@/lib/format'
import { publicUrl } from '@/lib/supabase'
import {
  ARTICLE_STATUS_LABELS,
  ArticleBody,
  ArticleGallery,
  asCategoryAccent,
  RelatedArticles,
  ReliabilityBadge,
  useArticleViewOnce,
  useNewsArticle,
  useRelatedNews,
} from '@/features/news'
import s from '@/features/news/ArticlePage.module.css'

export default function NewsArticlePage() {
  const { slug } = useParams<{ slug: string }>()

  const query = useNewsArticle(slug)
  const article = query.data ?? null

  // Une vue par session et par article. Refusee par la base pour un visiteur :
  // voir `useArticleViewOnce`. `view_count` n'est donc affiche nulle part.
  useArticleViewOnce(article?.id)

  const related = useRelatedNews(article)

  /* ------------------------------------------------------------ chargement */
  if (query.isLoading) {
    return (
      <article className={`${s.page} page`} aria-busy="true">
        <Skeleton width={160} height={20} radius="full" />
        <Skeleton width="86%" height={44} radius="md" />
        <Skeleton lines={2} height="1.1em" />
        <Skeleton width="100%" height={280} radius="lg" />
        <Skeleton lines={6} height="1.1em" />
      </article>
    )
  }

  /* ---------------------------------------------------------------- erreur */
  if (query.isError) {
    return (
      <section className={`${s.page} page`}>
        <ErrorState
          error={query.error}
          title="Article indisponible"
          onRetry={() => void query.refetch()}
        />
      </section>
    )
  }

  /* ------------------------------------------------------------------- 404 */
  if (!article) {
    return (
      <section className={`${s.page} page`}>
        <EmptyState
          illustration={<Icon name="search" size={40} />}
          title="Article introuvable"
          description={
            slug
              ? `Aucune actualite visible ne correspond a l'adresse « ${slug} ». Le lien est peut-être errone, ou l'article a ete retire.`
              : "Cette adresse ne désigné aucun article."
          }
          action={
            <Button
              as="link"
              to="/actualites"
              variant="secondary"
              iconLeft={<Icon name="arrow-left" size={18} />}
            >
              Retour aux actualités
            </Button>
          }
        />
      </section>
    )
  }

  /* ---------------------------------------------------------------- succes */
  const cover = publicUrl('news', article.cover_url)
  const category = article.category
  const accent = asCategoryAccent(category?.accent)
  const shareUrl = `/actualites/${article.slug}`

  return (
    <article className={`${s.page} page`}>
      <Link className={s.back} to="/actualites">
        <Icon name="arrow-left" size={16} />
        Toutes les actualités
      </Link>

      {article.status !== 'published' ? (
        <p className={s.draft} role="note">
          <Icon name="lock" size={18} />
          <span>
            Cet article n'est pas publie (statut : {ARTICLE_STATUS_LABELS[article.status]}).
            Seule l'equipe LEONIDA peut le consulter.
          </span>
        </p>
      ) : null}

      <header className={s.head}>
        {/* Le niveau de fiabilite n'est PAS repete ici : il est rendu plus bas
            avec son explication (`withHelp`), une seule fois. */}
        {category ? (
          <div className={s.badges}>
            <Link
              className={cx(s.category, s[accent])}
              to={`/actualites?categorie=${encodeURIComponent(category.slug)}`}
            >
              {category.label}
            </Link>
          </div>
        ) : null}

        <h1 className={s.title}>{article.title}</h1>

        {article.excerpt ? <p className={s.excerpt}>{article.excerpt}</p> : null}

        <div className={s.byline}>
          <AuthorLine author={article.author} date={article.published_at} />
          {article.published_at ? (
            <span className={s.published}>Publie le {formatDate(article.published_at)}</span>
          ) : (
            <span className={cx(s.published, s.undated)}>Date de publication non precisee</span>
          )}
        </div>

        {/* Seule occurrence du niveau de fiabilite sur la page, en taille
            normale puisqu'elle ne double plus un badge place plus haut. */}
        <ReliabilityBadge reliability={article.reliability} withHelp className={s.help} />
      </header>

      {cover ? (
        <figure className={s.cover}>
          <img src={cover} alt="" decoding="async" />
        </figure>
      ) : null}

      <div className={s.actions}>
        <FavoriteButton targetType="news" targetId={article.id} withLabel />
        <ShareButton
          url={shareUrl}
          title={article.title}
          text={article.excerpt ?? undefined}
          withLabel
        />
        <ReportButton targetType="news" targetId={article.id} withLabel />
      </div>

      <ArticleBody body={article.body} hasSource={Boolean(article.source_url)} />

      <ArticleGallery media={article.media} />

      {article.source_name || article.source_url ? (
        <aside className={s.source}>
          <span className={s.sourceLabel}>Source</span>
          {article.source_url ? (
            <a
              className={s.sourceLink}
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{article.source_name ?? article.source_url}</span>
              <Icon name="external" size={16} />
            </a>
          ) : (
            <span className={s.sourceName}>{article.source_name}</span>
          )}
        </aside>
      ) : null}

      {article.tags.length > 0 ? (
        <div className={s.tags}>
          <span className={s.tagsLabel}>Tags</span>
          <ul className={s.tagList}>
            {article.tags.map((tag) => (
              <li key={tag}>
                <Link className={s.tag} to={`/actualites?tag=${encodeURIComponent(tag)}`}>
                  #{tag}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className={s.reactions} aria-label="Reactions">
        <ReactionBar targetType="news" targetId={article.id} />
      </section>

      <CommentThread
        targetType="news"
        targetId={article.id}
        allowComments={article.allow_comments}
      />

      <RelatedArticles
        articles={related.data}
        isLoading={related.isLoading && Boolean(article.category_id)}
        error={related.error}
        category={category}
      />
    </article>
  )
}
