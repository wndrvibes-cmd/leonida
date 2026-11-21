import type { ReactNode } from 'react'
import { Button, Icon, Input, Select, cx } from '@/components/ui'
import { MIN_SEARCH_LENGTH } from '@/services/query'
import {
  POST_TYPE_OPTIONS, asPostType, hasActiveCommunityFilters, isTypeLocked,
  type CommunityFilters,
} from './communityFilters'
import s from './CommunityToolbar.module.css'

export interface CommunityToolbarProps {
  filters: CommunityFilters
  /** Valeur affichee : elle precede l'URL, qui attend la pause de frappe. */
  search: string
  onSearchChange: (value: string) => void
  onChange: (next: CommunityFilters) => void
  onReset: () => void
  /** Tags REELLEMENT presents dans les publications chargees. */
  tags: string[]
  /** Bouton « Publier », fourni par la page. */
  action?: ReactNode
}

/**
 * Barre de filtres du fil communautaire.
 *
 * Chaque controle est branche sur une vraie requete : aucun filtre decoratif.
 * L'état complet remonte a la page, qui l'ecrit dans l'URL.
 */
export function CommunityToolbar({
  filters,
  search,
  onSearchChange,
  onChange,
  onReset,
  tags,
  action,
}: CommunityToolbarProps) {
  const trimmed = search.trim()
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_SEARCH_LENGTH
  const typeLocked = isTypeLocked(filters.tab)
  const active = hasActiveCommunityFilters(filters)

  // Le tag de l'URL peut ne pas figurer dans les publications chargees : on
  // l'ajoute en tete pour pouvoir le retirer sans deviner.
  const visibleTags = filters.tag && !tags.includes(filters.tag) ? [filters.tag, ...tags] : tags

  return (
    <div className={s.wrap}>
      <div className={s.row}>
        <Input
          type="search"
          label="Rechercher"
          placeholder="Un mot du titre ou du message"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          hint={
            tooShort
              ? `${MIN_SEARCH_LENGTH} caracteres minimum pour lancer la recherche.`
              : undefined
          }
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
          label="Type"
          value={typeLocked ? 'discovery' : filters.type}
          placeholder="Tous les types"
          options={POST_TYPE_OPTIONS}
          disabled={typeLocked}
          hint={typeLocked ? "Impose par l'onglet Découvertes." : undefined}
          onChange={(event) => onChange({ ...filters, type: asPostType(event.target.value) })}
          fieldClassName={s.select}
        />

        {action ? <div className={s.action}>{action}</div> : null}
      </div>

      {visibleTags.length > 0 ? (
        <div className={s.tagsBlock}>
          <span className={s.legend} id="community-tags-legend">
            Tags des publications chargées
          </span>

          <div className="scroll-x">
            <div className={s.chips} role="group" aria-labelledby="community-tags-legend">
              {visibleTags.map((tag) => {
                const selected = filters.tag === tag
                return (
                  <button
                    key={tag}
                    type="button"
                    className={cx(s.chip, selected && s.chipActive)}
                    aria-pressed={selected}
                    onClick={() => onChange({ ...filters, tag: selected ? '' : tag })}
                  >
                    #{tag}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}

      {active ? (
        <div className={s.reset}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            iconLeft={<Icon name="refresh" size={16} />}
          >
            Reinitialiser les filtres
          </Button>
        </div>
      ) : null}
    </div>
  )
}
