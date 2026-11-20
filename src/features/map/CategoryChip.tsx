import type { CSSProperties } from 'react'
import { Icon } from '@/components/ui'
import type { MapCategory } from '@/services/map'
import { categoryAccent, categoryIcon } from './categoryIcons'
import s from './CategoryChip.module.css'

/**
 * Puce de categorie.
 *
 * Pourquoi pas `<Badge>` : la couleur vient de `map_categories.accent`, une
 * donnee de la base, et doit donc etre injectee au rendu. `Badge` expose des
 * tonalites fixes et n'accepte pas de style — une puce dediee est la bonne
 * reponse, plutot que de detourner une primitive partagee.
 *
 * La meme puce sert en lecture (fiche d'une decouverte) et en filtre
 * multi-selection (barre d'outils), selon qu'un `onToggle` est fourni.
 */

export interface CategoryChipProps {
  category: MapCategory
  /** Fourni = puce de filtre cliquable ; absent = simple etiquette. */
  onToggle?: (id: string) => void
  selected?: boolean
  /** Nombre de decouvertes de cette categorie actuellement affichees. */
  count?: number
}

export function CategoryChip({ category, onToggle, selected = false, count }: CategoryChipProps) {
  // `CSSProperties` ne declare pas les variables CSS : l'assertion est
  // l'idiome usuel, et la valeur est deja validee par `categoryAccent`.
  const style = { '--chip-accent': categoryAccent(category.accent) } as CSSProperties

  const content = (
    <>
      <Icon name={categoryIcon(category.icon)} size={15} />
      <span className={s.label}>{category.label}</span>
      {typeof count === 'number' ? <span className={s.count}>{count}</span> : null}
    </>
  )

  if (!onToggle) {
    return <span className={`${s.chip} ${s.static}`} style={style}>{content}</span>
  }

  return (
    <button
      type="button"
      className={`${s.chip} ${selected ? s.selected : ''}`}
      style={style}
      onClick={() => onToggle(category.id)}
      aria-pressed={selected}
    >
      {content}
    </button>
  )
}

export default CategoryChip
