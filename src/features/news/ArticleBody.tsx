import { useMemo } from 'react'
import { Icon } from '@/components/ui'
import s from './ArticleBody.module.css'

export interface ArticleBodyProps {
  body: string | null
  /** Permet d'orienter vers la source quand le corps du texte est vide. */
  hasSource: boolean
}

/**
 * Corps d'un article.
 *
 * Le texte est rendu comme du TEXTE : aucun `dangerouslySetInnerHTML`, aucune
 * interpretation de balises ni de Markdown. Un article est redige en base par
 * le staff, mais le front n'a aucune raison d'ouvrir une porte d'injection
 * pour autant. Les paragraphes sont separes par une ligne vide, les retours a
 * la ligne simples sont preserves par la mise en forme (`pre-line`).
 */
export function ArticleBody({ body, hasSource }: ArticleBodyProps) {
  const paragraphs = useMemo(
    () =>
      (body ?? '')
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter((block) => block.length > 0),
    [body],
  )

  if (paragraphs.length === 0) {
    return (
      <p className={s.missing} role="note">
        <Icon name="info" size={18} />
        <span>
          {hasSource
            ? "Cet article n'a pas de texte dans LEONIDA : seule la source d'origine, indiquee plus bas, fait foi."
            : "Cet article n'a pas encore de texte."}
        </span>
      </p>
    )
  }

  return (
    <div className={s.body}>
      {paragraphs.map((paragraph, position) => (
        <p key={position}>{paragraph}</p>
      ))}
    </div>
  )
}
