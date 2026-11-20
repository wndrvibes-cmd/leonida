import type { NewsCategory } from '@/services/news'

/**
 * `news_categories.accent` ne contient PAS une couleur mais le nom d'une
 * famille de jetons (`'surf'`, `'palm'`, `'sunset'`, `'sand'` — voir la
 * migration 0007). On le convertit donc en classe CSS, jamais en style
 * en ligne : aucune couleur ne traverse le JavaScript.
 */
const ACCENTS = ['surf', 'palm', 'sunset', 'sand'] as const

export type CategoryAccent = (typeof ACCENTS)[number]

export function asCategoryAccent(value: string | null | undefined): CategoryAccent {
  return ACCENTS.includes(value as CategoryAccent) ? (value as CategoryAccent) : 'surf'
}

export interface CategoryIndex {
  bySlug: Map<string, NewsCategory>
  byId: Map<string, NewsCategory>
}

export function indexCategories(categories: readonly NewsCategory[] | undefined): CategoryIndex {
  const bySlug = new Map<string, NewsCategory>()
  const byId = new Map<string, NewsCategory>()
  for (const category of categories ?? []) {
    bySlug.set(category.slug, category)
    byId.set(category.id, category)
  }
  return { bySlug, byId }
}
