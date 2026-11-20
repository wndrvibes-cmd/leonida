import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/AuthProvider'
import { Icon } from '@/components/ui'
import { DesktopNav } from '@/components/layout/DesktopNav'
import { Logo } from '@/components/layout/Logo'
import { NotificationsBell } from '@/components/layout/NotificationsBell'
import { UserMenu } from '@/components/layout/UserMenu'
import s from './TopBar.module.css'

/**
 * Barre du haut, fixe et translucide.
 *
 * Sur mobile elle se limite au logo, a la recherche et au compte : la
 * navigation entre rubriques se fait par la barre d'onglets basse.
 */
export function TopBar() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    navigate(`/recherche?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <header className={s.bar}>
      <div className={s.inner}>
        <Link to="/" className={s.brand} aria-label="LEONIDA — accueil">
          <Logo variant="full" size={24} label={null} />
        </Link>

        <DesktopNav />

        <div className={s.actions}>
          <form className={s.search} role="search" onSubmit={submit}>
            <Icon name="search" size={18} />
            <label htmlFor="recherche-barre" className="sr-only">Rechercher sur LEONIDA</label>
            <input
              id="recherche-barre"
              type="search"
              className={s.input}
              placeholder="Rechercher…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
            />
          </form>

          <Link to="/recherche" className={s.iconLink} aria-label="Rechercher">
            <Icon name="search" size={22} />
          </Link>

          {session ? (
            <>
              <NotificationsBell />
              <UserMenu />
            </>
          ) : (
            <Link to="/connexion" className={s.signIn}>Connexion</Link>
          )}
        </div>
      </div>
    </header>
  )
}

export default TopBar
