import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, EmptyState, ErrorState, Icon, Skeleton, SkeletonAvatar } from '@/components/ui'
import { DeletePostDialog, PostDetail, PostEditor, usePost } from '@/features/community'
import s from '@/features/community/PostPage.module.css'

/**
 * L'identifiant d'une publication est un `uuid` en base. Un identifiant
 * malforme n'est pas une panne : on affiche « introuvable » au lieu de laisser
 * PostgreSQL renvoyer une erreur de syntaxe.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function BackLink() {
  return (
    <Link to="/communaute" className={s.back}>
      <Icon name="arrow-left" size={16} />
      Retour au fil
    </Link>
  )
}

export default function PostPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const validId = id && UUID.test(id) ? id : undefined
  const post = usePost(validId)

  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const notFound = !validId || (post.isSuccess && post.data === null)

  return (
    <section className={`${s.page} page`}>
      <BackLink />

      {post.isLoading && validId ? (
        <div className={s.skeleton} aria-busy="true">
          <Skeleton width="30%" height={14} radius="full" />
          <Skeleton width="80%" height={28} />
          <div className={s.skeletonHead}>
            <SkeletonAvatar size={44} />
            <Skeleton width="40%" height={12} />
          </div>
          <Skeleton lines={6} />
        </div>
      ) : post.isError ? (
        <ErrorState
          error={post.error}
          title="Publication indisponible"
          onRetry={() => void post.refetch()}
        />
      ) : notFound ? (
        <EmptyState
          illustration={<Icon name="community" size={38} />}
          title="Publication introuvable"
          description="Ce lien ne mene a aucune publication visible. Elle a peut-être été supprimée par son auteur, ou masquee par la modération."
          action={
            <Button
              as="link"
              to="/communaute"
              variant="secondary"
              iconLeft={<Icon name="community" size={18} />}
            >
              Voir le fil de la communauté
            </Button>
          }
        />
      ) : post.data ? (
        <>
          <PostDetail
            post={post.data}
            onEdit={() => setEditing(true)}
            onDelete={() => setDeleting(true)}
          />

          {editing ? (
            <PostEditor post={post.data} onClose={() => setEditing(false)} />
          ) : null}

          {deleting ? (
            <DeletePostDialog
              post={post.data}
              onCancel={() => setDeleting(false)}
              onDeleted={() => {
                setDeleting(false)
                navigate('/communaute', { replace: true })
              }}
            />
          ) : null}
        </>
      ) : null}
    </section>
  )
}
