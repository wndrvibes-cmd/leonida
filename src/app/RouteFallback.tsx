import s from './RouteFallback.module.css'

interface RouteFallbackProps {
  /** Texte annonce aux lecteurs d'écran pendant l'attente. */
  label?: string
  /** `page` occupe toute la hauteur utile, `inline` se contente de sa place. */
  tone?: 'page' | 'inline'
}

/**
 * Attente de chargement d'une route decoupee (React.lazy) ou d'une
 * verification de session. Un squelette plutot qu'un indicateur tournant :
 * la silhouette de la page apparait avant son contenu.
 */
export function RouteFallback({ label = 'Chargement…', tone = 'page' }: RouteFallbackProps) {
  return (
    <div className={tone === 'page' ? s.page : s.inline} role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className={s.bars} aria-hidden="true">
        <span className={s.bar} />
        <span className={s.bar} />
        <span className={s.bar} />
      </div>
    </div>
  )
}
