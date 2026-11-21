import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/AuthProvider'
import { Avatar, Icon, useToast } from '@/components/ui'
import { publicUrl, readableError } from '@/lib/supabase'
import s from './UserMenu.module.css'

/**
 * Avatar + menu du membre connecte.
 *
 * Le menu se ferme au clic a l'exterieur, a la touche Echap et au changement
 * de page : sur mobile, un menu reste ouvert par-dessus la nouvelle page est
 * toujours vecu comme un bug.
 */
export function UserMenu() {
  const { profile, user, isStaff, isPremium, signOut } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => { setOpen(false) }, [location.pathname])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const name = profile?.display_name ?? profile?.username ?? user?.email ?? 'Mon compte'
  const profileHref = profile ? `/profil/${profile.username}` : null
  // `avatar_url` contient un chemin de bucket : il faut le resoudre en URL publique.
  const avatarSrc = publicUrl('avatars', profile?.avatar_url)

  const handleSignOut = async () => {
    setBusy(true)
    try {
      await signOut()
      setOpen(false)
      navigate('/')
    } catch (error) {
      toast.error('Déconnexion impossible', readableError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={s.wrap} ref={wrapRef}>
      <button
        type="button"
        className={s.trigger}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
      >
        <Avatar src={avatarSrc} name={name} size="sm" isPremium={isPremium} />
        <span className={s.name}>{name}</span>
        <Icon
          name="chevron-down"
          size={16}
          className={open ? `${s.chevron} ${s.chevronOpen}` : s.chevron}
        />
        <span className="sr-only">Menu du compte</span>
      </button>

      <div id={menuId} className={s.menu} role="menu" hidden={!open}>
        <p className={s.header}>
          <span className={s.headerName}>{name}</span>
          {profile && <span className={s.headerHandle}>@{profile.username}</span>}
        </p>

        {profileHref ? (
          <Link to={profileHref} className={s.item} role="menuitem">
            <Icon name="user" size={18} /> Mon profil
          </Link>
        ) : (
          // Pas de faux lien : sans profil charge, son adresse est inconnue.
          <span className={s.itemDisabled} aria-disabled="true">
            <Icon name="user" size={18} /> Profil indisponible — rechargez la page
          </span>
        )}

        <Link to="/favoris" className={s.item} role="menuitem">
          <Icon name="heart" size={18} /> Mes favoris
        </Link>
        <Link to="/parametres" className={s.item} role="menuitem">
          <Icon name="settings" size={18} /> Paramètres
        </Link>

        {isStaff && (
          <Link to="/admin" className={s.item} role="menuitem">
            <Icon name="shield" size={18} /> Administration
          </Link>
        )}

        <button
          type="button"
          className={s.item}
          role="menuitem"
          onClick={handleSignOut}
          disabled={busy}
        >
          <Icon name="logout" size={18} /> {busy ? 'Deconnexion…' : 'Se deconnecter'}
        </button>
      </div>
    </div>
  )
}

export default UserMenu
