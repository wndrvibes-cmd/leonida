import { Button, cx, Icon, Input, Select, Skeleton } from '@/components/ui'
import type { NewsCategory } from '@/services/news'
import { MIN_SEARCH_LENGTH } from '@/services/query'
import { asCategoryAccent } from './categories'
import {
  asReliability,
  asSort,
  hasActiveNewsFilters,
  RELIABILITY_OPTIONS,
  SORT_OPTIONS,
  type NewsFilters,
} from './newsFilters'
import s from './NewsFilterBar.module.css'

export interface NewsFilterBarProps {
  filters: NewsFilters
  /** Valeur affichee dans le champ : elle precede l'URL, qui attend la pause de frappe. */
  search: string
  onSearchChange: (value: string) => void
  onChange: (next: NewsFilters) => void
  onReset: () => void
  categories: NewsCategory[] | undefined
  categoriesLoading: boolean
}

/**
 * Barre de filtres de /actualites.
 *
 * Chaque controle est reellement branche : aucun bouton decoratif. L'etat
 * complet remonte a la page, qui l'ecrit dans l'URL.
 */
export function NewsFilterBar({
  filters,
  search,
  onSearchChange,
  onChange,
  onReset,
  categories,
  categoriesLoading,
}: NewsFilterBarProps) {
  const trimmed = search.trim()
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_SEARCH_LENGTH
  const active = hasActiveNewsFilters(filters)

  return (
    <div className={s.wrap}>
      <div className={s.row}>
        <Input
          type="search"
          label="Rechercher"
          placeholder="Titre ou resume d'une actualite"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          hint={tooShort ? `${MIN_SEARCH_LENGTH} caracteres minimum pour lancer la recherche.` : undefined}
          iconLeft={<Icon name="search" size={16} />}
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="search"
          fieldClassName={s.search}
          addonRight={
            search ? (
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                aria-label="Effacer la recherche"
                onClick={() => onSearchChange('')}
              >
                <Icon name="close" size={16} />
              </Button>
            ) : undefined
          }
        />

        <Select
          label="Fiabilite"
          value={filters.reliability}
          placeholder="Tous les niveaux"
          options={RELIABILITY_OPTIONS}
          onChange={(event) => onChange({ ...filters, reliability: asReliability(event.target.value) })}
          fieldClassName={s.select}
        />

        <Select
          label="Trier par"
          value={filters.sort}
          options={SORT_OPTIONS}
          onChange={(event) => onChange({ ...filters, sort: asSort(event.target.value) })}
          fieldClassName={s.select}
        />
      </div>

      <div className={s.categories}>
        <span className={s.legend} id="news-categories-legend">
          Categories
        </span>

        <div className="scroll-x">
          <div className={s.chips} role="group" aria-labelledby="news-categories-legend">
            {categoriesLoading ? (
              <>
                <Skeleton width={96} height={40} radius="full" />
                <Skeleton width={120} height={40} radius="full" />
                <Skeleton width={88} height={40} radius="full" />
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={cx(s.chip, !filters.category && s.chipActive)}
                  aria-pressed={!filters.category}
                  onClick={() => onChange({ ...filters, category: '' })}
                >
                  Toutes
                </button>

                {(categories ?? []).map((category) => {
                  const selected = filters.category === category.slug
                  return (
                    <button
                      key={category.id}
                      type="button"
                      className={cx(
                        s.chip,
                        s[asCategoryAccent(category.accent)],
                        selected && s.chipActive,
                      )}
                      aria-pressed={selected}
                      onClick={() =>
                        onChange({ ...filters, category: selected ? '' : category.slug })
                      }
                    >
                      {category.label}
                    </button>
                  )
                })}
              </>
            )}
          </div>
        </div>
      </div>

      {filters.tag || active ? (
        <div className={s.pills}>
          {filters.tag ? (
            <button
              type="button"
              className={s.pill}
              aria-label={`Retirer le filtre sur le tag ${filters.tag}`}
              onClick={() => onChange({ ...filters, tag: '' })}
            >
              <span>Tag : {filters.tag}</span>
              <Icon name="close" size={14} />
            </button>
          ) : null}

          {active ? (
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<Icon name="refresh" size={16} />}
              onClick={onReset}
            >
              Reinitialiser
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
