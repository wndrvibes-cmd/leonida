import PagePlaceholder from '@/components/shared/PagePlaceholder'

/**
 * Fichier d'attente.
 * Cet ecran sera remplace par son implementation definitive ; il n'affiche
 * aucune donnee inventee en attendant.
 */
export default function NewsPage() {
  return (
    <PagePlaceholder
      title="Actualites"
      description="Toutes les actualites de GTA VI, classees par categorie et accompagnees de leur niveau de fiabilite (officiel, source fiable, communaute, rumeur)."
    />
  )
}
