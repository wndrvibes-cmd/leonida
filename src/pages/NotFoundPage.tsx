import { Link, useLocation } from 'react-router-dom'
import { Logo } from '@/components/layout/Logo'
import { Icon } from '@/components/ui'
import s from './NotFoundPage.module.css'

/** Page 404 : on indique le chemin demande plutot qu'un message generique. */
export function NotFoundPage() {
  const { pathname } = useLocation()

  return (
    <section className={`${s.wrap} page`}>
      <div className={s.card}>
        <Logo variant="mark" size={56} label={null} className={s.mark} />

        <p className={s.code}>404</p>
        <h1 className={s.title}>Cette page n'existe pas</h1>
        <p className={s.body}>
          Le chemin <code className={s.path}>{pathname}</code> ne correspond a
          aucune rubrique de LEONIDA. Il a peut-être été renomme, ou le lien
          que vous avez suivi est incomplet.
        </p>

        <div className={s.actions}>
          <Link className={s.primary} to="/">
            <Icon name="arrow-left" size={18} /> Retour a l'accueil
          </Link>
          <Link className={s.secondary} to="/carte">
            <Icon name="compass" size={18} /> Explorer la carte
          </Link>
        </div>

        <div className={s.more}>
          <Link to="/actualites">Actualités</Link>
          <Link to="/communaute">Communauté</Link>
          <Link to="/recherche">Recherche</Link>
        </div>
      </div>
    </section>
  )
}

export default NotFoundPage
