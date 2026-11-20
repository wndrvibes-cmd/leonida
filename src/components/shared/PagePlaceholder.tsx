import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import s from './PagePlaceholder.module.css'

export interface PagePlaceholderProps {
  /** Nom de la rubrique, tel qu'il apparaitra dans la navigation. */
  title: string
  /** Ce que cette rubrique proposera, decrit honnetement. */
  description?: string
  /** Contenu libre (liens utiles, precisions). */
  children?: ReactNode
}

/**
 * Etat « en construction ».
 *
 * Volontairement sans faux contenu : pas d'exemple d'article, pas de membre
 * fictif, pas de compteur invente. On annonce simplement que la rubrique
 * n'est pas encore disponible, et on propose des destinations reelles.
 */
export function PagePlaceholder({ title, description, children }: PagePlaceholderProps) {
  return (
    <section className={`${s.wrap} page`}>
      <p className={s.kicker}>En construction</p>
      <h1 className={s.title}>{title}</h1>
      <p className={s.body}>
        {description ?? "Cette rubrique n'est pas encore disponible."}
      </p>
      <p className={s.note}>
        Aucune donnee n'est affichee ici pour l'instant : nous preferons une page
        vide a un contenu inverifie.
      </p>

      {children}

      <div className={s.links}>
        <Link className={s.link} to="/">Accueil</Link>
        <Link className={s.link} to="/actualites">Actualites</Link>
        <Link className={s.link} to="/carte">Carte</Link>
      </div>
    </section>
  )
}

export default PagePlaceholder
