import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, Icon, Modal, useToast } from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import { formatDate } from '@/lib/format'
import { readableError } from '@/lib/supabase'
import { deleteUpload } from '@/lib/upload'
import { EMPTY_POST_FORM, PostForm, type PostFormValues } from './PostForm'
import { useComposerDraft } from './useComposerDraft'
import { useCreateCommunityPost } from './useCommunity'
import s from './PostComposer.module.css'

export interface PostComposerProps {
  open: boolean
  onClose: () => void
}

/**
 * Composeur de publication communautaire.
 *
 * Le brouillon (texte, tags, images deja televersees, lien video) survit a une
 * fermeture accidentelle et a un echec d'envoi : il n'est efface qu'apres une
 * publication reellement acceptee par la base.
 *
 * Les verrous affiches ici ne protegent rien — la policy `posts_insert_own`
 * refuse l'insertion d'un visiteur comme d'un compte suspendu. Ils evitent
 * seulement de faire remplir un formulaire pour rien, et disent pourquoi.
 */
export function PostComposer({ open, onClose }: PostComposerProps) {
  const { user, isSuspended } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const draft = useComposerDraft()
  const create = useCreateCommunityPost()

  const [values, setValues] = useState<PostFormValues>(draft.restored ?? EMPTY_POST_FORM)
  const [restoredVisible, setRestoredVisible] = useState(draft.restored !== null)

  // Enregistrement differe du brouillon, tant que le dialogue est ouvert.
  const { save } = draft
  useEffect(() => {
    if (!open) return
    save(values)
  }, [open, values, save])

  async function discard() {
    const images = values.images
    setValues(EMPTY_POST_FORM)
    setRestoredVisible(false)
    draft.clear()
    create.reset()

    if (images.length === 0) return
    // Les fichiers etaient deja dans le bucket : les abandonner sans les
    // supprimer laisserait des images orphelines.
    const results = await Promise.allSettled(
      images.map((image) => deleteUpload(image.bucket, image.path)),
    )
    if (results.some((result) => result.status === 'rejected')) {
      toast.info(
        'Images partiellement supprimees',
        "Certaines images envoyees n'ont pas pu etre retirees du stockage.",
      )
    }
  }

  function submit() {
    create.mutate(values, {
      onSuccess: (result) => {
        draft.clear()
        setValues(EMPTY_POST_FORM)
        setRestoredVisible(false)
        onClose()

        if (result.mediaError) {
          // Honnetete : la publication EXISTE. Proposer un nouvel envoi
          // creerait un doublon, on dit donc exactement ce qui a echoue.
          toast.error(
            'Publication envoyee sans ses medias',
            `Le texte est publie, mais les images ou le lien video n'ont pas pu etre rattaches (${readableError(result.mediaError)}).`,
          )
        } else {
          toast.toast({
            title: 'Publication envoyee',
            description: 'Elle est visible dans le fil de la communaute.',
            variant: 'success',
            action: {
              label: 'Voir',
              onClick: () => navigate(`/communaute/${result.post.id}`),
            },
          })
        }
      },
      onError: (error) => {
        toast.error('Envoi impossible', readableError(error))
      },
    })
  }

  const locked = !user
    ? 'Connectez-vous pour publier dans la communaute.'
    : isSuspended
      ? 'Votre compte est suspendu : vous ne pouvez pas publier pour le moment.'
      : null

  return (
    <Modal
      open={open}
      onClose={create.isPending ? () => undefined : onClose}
      title="Nouvelle publication"
      description="Elle apparaitra immediatement dans le fil, publiee sous votre nom."
      size="md"
      disableBackdropClose={create.isPending}
    >
      {locked ? (
        <div className={s.locked} role="note">
          <Icon name="lock" size={20} className={s.lockIcon} />
          <p className={s.lockedText}>{locked}</p>
          {!user ? (
            // `state` transmet la page courante : LoginPage y revient apres la
            // connexion. Le `Button` de la bibliotheque n'expose pas cette
            // prop, d'ou un `Link` habille ici.
            <Link to="/connexion" state={{ from: location }} className={s.lockedAction}>
              <Icon name="user" size={18} />
              Se connecter
            </Link>
          ) : (
            <Link to="/parametres" className={s.lockedLink}>
              Voir mon compte
            </Link>
          )}
        </div>
      ) : (
        <div className={s.body}>
          {restoredVisible ? (
            <div className={s.draft} role="status">
              <Icon name="edit" size={16} />
              <span className={s.draftText}>
                Brouillon repris
                {draft.restoredAt ? ` (${formatDate(new Date(draft.restoredAt), true)})` : ''}.
              </span>
              <Button variant="ghost" size="sm" onClick={() => void discard()}>
                Repartir de zero
              </Button>
            </div>
          ) : null}

          {draft.unavailable ? (
            <p className={s.warning} role="note">
              <Icon name="alert" size={16} />
              Ce navigateur refuse le stockage local : votre brouillon ne sera pas
              conserve si vous fermez la page.
            </p>
          ) : null}

          <PostForm
            mode="create"
            value={values}
            onChange={setValues}
            onSubmit={submit}
            onCancel={onClose}
            submitting={create.isPending}
            submitLabel="Publier"
            userId={user?.id}
            error={create.isError ? readableError(create.error) : null}
          />
        </div>
      )}
    </Modal>
  )
}
