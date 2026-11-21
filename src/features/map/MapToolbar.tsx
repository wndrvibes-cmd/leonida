import type { ReactNode } from 'react'
import { Button, Icon, Input } from '@/components/ui'
import type { MapCategory } from '@/services/map'
import { CategoryChip } from './CategoryChip'
import s from './MapToolbar.module.css'

/**
 * Barre d'outils de la carte : recherche, filtres de categorie en
 * multi-selection, compteur de resultats, plein ecran et contribution.
 *
 * Le compteur annonce un nombre REEL de marqueurs charges : aucune
 * statistique n'est inventee, et quand la base est vide il affiche zero.
 */

export interface MapToolbarProps {
  categories: MapCategory[]
  selectedCategories: string[]
  onToggleCategory: (id: string) => void
  onClearCategories: () => void
  query: string
  onQueryChange: (value: string) => void
  /** Marqueurs affiches après filtrage. */
  resultCount: number
  /** Marqueurs validées chargées, toutes catégories confondues. */
  totalCount: number
  /** Nombre de marqueurs par catégorie, calcule sur les données reelles. */
  countsByCategory: Map<string, number>
  immersive: boolean
  onToggleImmersive: () => void
  /** Bouton de contribution, fourni par `ContributeFlow`. */
  contributeSlot?: ReactNode
}

export function MapToolbar(props: MapToolbarProps) {
  const {
    categories, selectedCategories, onToggleCategory, onClearCategories,
    query, onQueryChange, resultCount, totalCount, countsByCategory,
    immersive, onToggleImmersive, contributeSlot,
  } = props

  const filtered = selectedCategories.length > 0 || query.trim().length > 0

  return (
    <div className={s.bar}>
      <div className={s.row}>
        <Input
          className={s.search}
          fieldClassName={s.searchField}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Rechercher un lieu, un secret, un véhicule..."
          aria-label="Rechercher une découverte sur la carte"
          autoCapitalize="none"
          spellCheck={false}
          iconLeft={<Icon name="search" size={16} />}
        />

        <div className={s.rowActions}>
          {contributeSlot}
          <Button
            variant="secondary"
            size="md"
            iconOnly
            aria-label={immersive ? 'Quitter le plein écran' : 'Afficher la carte en plein écran'}
            aria-pressed={immersive}
            onClick={onToggleImmersive}
          >
            <Icon name={immersive ? 'close' : 'eye'} size={20} />
          </Button>
        </div>
      </div>

      {categories.length > 0 ? (
        <div className={`${s.chips} scroll-x`}>
          {categories.map((category) => (
            <CategoryChip
              key={category.id}
              category={category}
              selected={selectedCategories.includes(category.id)}
              onToggle={onToggleCategory}
              count={countsByCategory.get(category.id) ?? 0}
            />
          ))}
        </div>
      ) : null}

      <div className={s.status}>
        <p className={s.count} role="status">
          {resultCount === 0
            ? 'Aucune découverte affichée'
            : `${resultCount} decouverte${resultCount > 1 ? 's' : ''} affichée${resultCount > 1 ? 's' : ''}`}
          {filtered && totalCount !== resultCount ? ` sur ${totalCount}` : ''}
        </p>

        {filtered ? (
          <button
            type="button"
            className={s.clear}
            onClick={() => { onClearCategories(); onQueryChange('') }}
          >
            Tout effacer
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default MapToolbar
