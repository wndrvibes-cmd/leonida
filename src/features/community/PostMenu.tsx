import { useEffect, useId, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Button, Icon, useEscapeKey } from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import { ReportButton, ShareButton } from '@/features/engagement'
import { useOnClickOutside } from '@/hooks/useOnClickOutside'
import type { PostListItem } from '@/services/posts'
import s from './PostMenu.module.css'

export interface PostMenuProps {
  post: PostListItem
  /** Ouvre la correction. Fourni uniquement a l'auteur de la publication. */
  onEdit?: () => void
  /** Ouvre la demande de confirmation de suppression. */
  onDelete?: () => void
  size?: 'sm' | 'md'
}

/**
 * Actions d'une publication : partage, puis correction et suppression pour son
 * auteur, signalement pour les autres.
 *
 * Aucune entree decorative : un membre qui n'est pas l'auteur ne voit pas
 * « Modifier » grise, il voit « Signaler ». Un visiteur non connecte ne voit
 * que le partage — `ReportButton` l'inviterait de lui-meme a se connecter,
 * mais l'afficher laisserait croire que le signalement anonyme existe.
 */
export function PostMenu({ post, onEdit, onDelete, size = 'sm' }: PostMenuProps) {
  const { user } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const isAuthor = Boolean(user && post.author_id === user.id)
  const canEdit = isAuthor && Boolean(onEdit)
  const canDelete = isAuthor && Boolean(onDelete)

  // Generique explicite : aucune ambiguite d'inference sur le type de la ref.
  useOnClickOutside<HTMLDivElement>(wrapRef, () => setOpen(false), open)
  useEscapeKey(open, () => setOpen(false))

  // Un menu reste ouvert par-dessus la page suivante : toujours vecu comme un bug.
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  return (
    <div className={s.wrap} ref={wrapRef}>
      <Button
        variant="ghost"
        size={size}
        iconOnly
        onClick={() => setOpen((value) => !value)}
        aria-label="Actions sur la publication"
        aria-expanded={open}
        aria-haspopup
        aria-controls={menuId}
      >
        <Icon name="more" size={18} />
      </Button>

      {/* Le panneau reste MONTE, seulement masque : `ReportButton` ouvre un
          dialogue porte par un portail vers <body>. Le demonter au premier
          clic « a l'extérieur » — c'est-a-dire dans ce dialogue — ferait
          disparaitre le formulaire de signalement en pleine saisie. */}
      <div
        id={menuId}
        className={s.panel}
        role="group"
        aria-label={`Actions : ${post.title?.trim() || 'publication'}`}
        hidden={!open}
      >
        <ShareButton
          url={`/communaute/${post.id}`}
          title={post.title?.trim() || 'Publication LEONIDA'}
          withLabel
          className={s.item}
        />

        {canEdit ? (
          <Button
            variant="ghost"
            onClick={() => {
              setOpen(false)
              onEdit?.()
            }}
            iconLeft={<Icon name="edit" size={18} />}
            className={s.item}
          >
            Modifier
          </Button>
        ) : null}

        {canDelete ? (
          <Button
            variant="ghost"
            onClick={() => {
              setOpen(false)
              onDelete?.()
            }}
            iconLeft={<Icon name="trash" size={18} />}
            className={`${s.item} ${s.danger}`}
          >
            Supprimer
          </Button>
        ) : null}

        {!isAuthor && user ? (
          <ReportButton targetType="post" targetId={post.id} withLabel className={s.item} />
        ) : null}
      </div>
    </div>
  )
}
