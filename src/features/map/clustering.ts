import type { MapItem, MarkerWithCategory } from './types'

/**
 * Au-dela de ce nombre de marqueurs affiches, la carte regroupe par proximite.
 * En dessous, chaque decouverte garde son epingle : regrouper 20 points
 * nuirait a la lecture sans rien apporter.
 */
export const CLUSTER_THRESHOLD = 60

/** Cote d'une cellule de regroupement, en pixels d'ECRAN. */
const CELL_PX = 58

/**
 * Regroupement par grille de proximite.
 *
 * La grille est definie en pixels d'ecran puis ramenee en coordonnees
 * relatives : plus on zoome, plus l'image affichee est grande, donc plus les
 * cellules deviennent petites en coordonnees image — les regroupements se
 * dissolvent naturellement jusqu'a laisser apparaitre chaque epingle. C'est
 * le principe des cartes classiques, sans dependance externe.
 *
 * @param entries  marqueurs deja filtres
 * @param width    largeur de l'image AFFICHEE, en pixels d'ecran
 * @param height   hauteur de l'image AFFICHEE, en pixels d'ecran
 */
export function clusterMarkers(
  entries: MarkerWithCategory[],
  width: number,
  height: number,
): MapItem[] {
  if (entries.length <= CLUSTER_THRESHOLD || !(width > 0) || !(height > 0)) {
    return entries.map((entry) => ({
      kind: 'pin' as const,
      id: entry.marker.id,
      point: { x: entry.marker.x, y: entry.marker.y },
      entry,
    }))
  }

  // Taille d'une cellule en coordonnees relatives 0..1.
  const cellX = CELL_PX / width
  const cellY = CELL_PX / height

  const buckets = new Map<string, MarkerWithCategory[]>()
  for (const entry of entries) {
    const col = Math.floor(entry.marker.x / cellX)
    const row = Math.floor(entry.marker.y / cellY)
    const key = `${col}:${row}`
    const bucket = buckets.get(key)
    if (bucket) bucket.push(entry)
    else buckets.set(key, [entry])
  }

  const items: MapItem[] = []
  for (const [key, bucket] of buckets) {
    const first = bucket[0]
    if (bucket.length === 1 && first) {
      items.push({
        kind: 'pin',
        id: first.marker.id,
        point: { x: first.marker.x, y: first.marker.y },
        entry: first,
      })
      continue
    }
    // Le regroupement se pose au barycentre reel de ses marqueurs.
    let sx = 0
    let sy = 0
    for (const entry of bucket) {
      sx += entry.marker.x
      sy += entry.marker.y
    }
    items.push({
      kind: 'cluster',
      id: `cluster-${key}`,
      point: { x: sx / bucket.length, y: sy / bucket.length },
      entries: bucket,
    })
  }

  return items
}
