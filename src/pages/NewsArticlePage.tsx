import PagePlaceholder from '@/components/shared/PagePlaceholder'

/**
 * Fichier d'attente.
 * Cet ecran sera remplace par son implementation definitive ; il n'affiche
 * aucune donnee inventee en attendant.
 */
export default function NewsArticlePage() {
  return (
    <PagePlaceholder
      title="Article"
      description="La lecture d'une actualite, ses medias, sa source et les commentaires des membres."
    />
  )
}
