import { useState } from 'react'
import { Icon, Modal, useToast } from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import { readableError } from '@/lib/supabase'
import type { PostListItem } from '@/services/posts'
import { PostForm, type PostFormValues } from './PostForm'
import { useUpdateCommunityPost } from './useCommunity'
import s from './PostComposer.module.css'

export interface PostEditorProps {
  /** Publication a corriger. Le composant est monte uniquement quand elle existe. */
  post: PostListItem
  onClose: () => void
}

/**
 * Correction d'une publication par son auteur.
 *
 * Seuls les champs de la table `posts` sont modifiables (type, titre, message,
 * tags) : les medias vivent dans `post_media`, et l'epinglage comme les
 * compteurs sont restaures cote base par `tg_protect_post_fields` pour un
 * non-staff. Le formulaire le dit au lieu de proposer des champs sans effet.
 */
export function PostEditor({ post, onClose }: PostEditorProps) {
  const { isSuspended, user } = useAuth()
  const toast = useToast()
  const update = useUpdateCommunityPost(post.id)

  const [values, setValues] = useState<PostFormValues>({
    postType: post.post_type,
    title: post.title ?? '',
    body: post.body ?? '',
    tags: [...post.tags],
    images: [],
    videoUrl: '',
  })

  function submit() {
    update.mutate(
      {
        postType: values.postType,
        title: values.title,
        body: values.body,
        tags: values.tags,
      },
      {
        onSuccess: () => {
          toast.success('Publication mise à jour')
          onClose()
        },
        onError: (error) => toast.error('Modification impossible', readableError(error)),
      },
    )
  }

  return (
    <Modal
      open
      onClose={update.isPending ? () => undefined : onClose}
      title="Modifier la publication"
      description="La date de publication d'origine est conservée."
      size="md"
      disableBackdropClose={update.isPending}
    >
      {isSuspended ? (
        <div className={s.locked} role="note">
          <Icon name="lock" size={20} className={s.lockIcon} />
          <p className={s.lockedText}>
            Votre compte est suspendu : vos publications ne peuvent pas être modifiées
            pour le moment.
          </p>
        </div>
      ) : (
        <PostForm
          mode="edit"
          value={values}
          onChange={setValues}
          onSubmit={submit}
          onCancel={onClose}
          submitting={update.isPending}
          submitLabel="Enregistrer"
          userId={user?.id}
          error={update.isError ? readableError(update.error) : null}
        />
      )}
    </Modal>
  )
}
