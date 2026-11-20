import PagePlaceholder from '@/components/shared/PagePlaceholder'

/**
 * Fichier d'attente.
 * Cet ecran sera remplace par son implementation definitive ; il n'affiche
 * aucune donnee inventee en attendant.
 */
export default function HomePage() {
  return (
    <PagePlaceholder
      title="Accueil"
      description="Le fil d'accueil rassemblera les dernieres actualites, les decouvertes recentes de la carte et les publications de la communaute."
    />
  )
}
