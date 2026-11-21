import { useState, type FormEvent, type KeyboardEvent } from 'react'
import {
  Badge, Button, Icon, ImageUploader, Input, Select, Textarea,
} from '@/components/ui'
import { slugify } from '@/lib/format'
import type { UploadedImage } from '@/lib/upload'
import type { Database } from '@/types/database'
import { COMPOSER_TYPE_OPTIONS } from './communityFilters'
import { VIDEO_LINK_ERROR, VIDEO_LINK_HINT, parseVideoLink } from './videoLink'
import s from './PostForm.module.css'

type PostType = Database['public']['Enums']['post_type']

/** Alignees sur les contraintes de la table `posts`. */
export const TITLE_MAX = 140
export const BODY_MAX = 8000
export const TAGS_MAX = 6
export const TAG_LENGTH_MAX = 24
export const IMAGES_MAX = 4

export interface PostFormValues {
  postType: PostType
  title: string
  body: string
  tags: string[]
  images: UploadedImage[]
  videoUrl: string
}

export const EMPTY_POST_FORM: PostFormValues = {
  postType: 'discussion',
  title: '',
  body: '',
  tags: [],
  images: [],
  videoUrl: '',
}

export interface PostFormProps {
  /** `edit` masque les medias : ils vivent dans `post_media`, pas dans `posts`. */
  mode: 'create' | 'edit'
  value: PostFormValues
  onChange: (next: PostFormValues) => void
  /** Appele uniquement si la saisie est valide. */
  onSubmit: () => void
  onCancel: () => void
  submitting: boolean
  submitLabel: string
  userId: string | null | undefined
  /** Erreur remontee par la mutation (reseau, RLS...). */
  error?: string | null
}

/** Normalise un tag saisi : minuscules, sans accent, sans espace. */
function normalizeTag(raw: string): string {
  return slugify(raw.replace(/^#+/, '')).slice(0, TAG_LENGTH_MAX)
}

/**
 * Formulaire d'une publication communautaire.
 *
 * Entierement CONTROLE par son parent : c'est ce qui permet au composeur de
 * conserver un brouillon sans que ce formulaire connaisse le stockage local.
 *
 * Ce qu'il verifie (titre OU message, longueurs, lien video) reprend les
 * contraintes reelles de la base — `posts_has_content`, `length(title) <= 140`,
 * `length(body) <= 8000`. Il ne protege rien : la base refuse de toute facon.
 */
export function PostForm({
  mode,
  value,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  submitLabel,
  userId,
  error,
}: PostFormProps) {
  const [tagDraft, setTagDraft] = useState('')
  const [touched, setTouched] = useState(false)

  const patch = (next: Partial<PostFormValues>) => onChange({ ...value, ...next })

  const title = value.title.trim()
  const body = value.body.trim()
  const videoRaw = value.videoUrl.trim()
  const video = videoRaw ? parseVideoLink(videoRaw) : null

  const contentError = !title && !body ? 'Ecrivez au moins un titre ou un message.' : null
  const videoError = videoRaw && !video ? VIDEO_LINK_ERROR : null
  const valid = !contentError && !videoError

  function addTag(raw: string) {
    const tag = normalizeTag(raw)
    // Trop court : on GARDE la saisie plutot que de l'effacer en silence.
    if (!tag || tag.length < 2) return
    setTagDraft('')
    if (value.tags.includes(tag) || value.tags.length >= TAGS_MAX) return
    patch({ tags: [...value.tags, tag] })
  }

  function onTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag(tagDraft)
    }
    if (event.key === 'Backspace' && tagDraft === '' && value.tags.length > 0) {
      patch({ tags: value.tags.slice(0, -1) })
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    if (!valid || submitting) return
    onSubmit()
  }

  const tagsFull = value.tags.length >= TAGS_MAX

  return (
    <form className={s.form} onSubmit={handleSubmit} noValidate>
      <Select
        label="Type de publication"
        value={value.postType}
        options={COMPOSER_TYPE_OPTIONS}
        onChange={(event) => patch({ postType: event.target.value as PostType })}
        hint="Il oriente les filtres du fil : choisissez le plus proche de votre message."
        disabled={submitting}
      />

      <Input
        label="Titre (facultatif)"
        value={value.title}
        maxLength={TITLE_MAX}
        placeholder="Une phrase qui resume votre publication"
        onChange={(event) => patch({ title: event.target.value })}
        disabled={submitting}
        enterKeyHint="next"
      />

      <Textarea
        label="Message"
        value={value.body}
        rows={6}
        maxLength={BODY_MAX}
        showCount
        placeholder="Partagez votre decouverte, votre astuce ou votre question."
        onChange={(event) => patch({ body: event.target.value })}
        error={touched ? contentError : null}
        disabled={submitting}
      />

      {/* ------------------------------------------------------------- tags */}
      <div className={s.block}>
        <Input
          label={`Tags (${value.tags.length} / ${TAGS_MAX})`}
          value={tagDraft}
          placeholder={tagsFull ? 'Limite atteinte' : 'vehicule, leonida-keys...'}
          hint="Entree pour valider. 2 caracteres minimum, minuscules sans accent ni espace."
          onChange={(event) => setTagDraft(event.target.value)}
          onKeyDown={onTagKeyDown}
          disabled={submitting || tagsFull}
          maxLength={TAG_LENGTH_MAX + 6}
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="done"
          addonRight={
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label="Ajouter le tag"
              disabled={submitting || tagsFull || normalizeTag(tagDraft).length < 2}
              onClick={() => addTag(tagDraft)}
            >
              <Icon name="plus" size={16} />
            </Button>
          }
        />

        {value.tags.length > 0 ? (
          <ul className={s.tags}>
            {value.tags.map((tag) => (
              <li key={tag}>
                <button
                  type="button"
                  className={s.tag}
                  onClick={() => patch({ tags: value.tags.filter((item) => item !== tag) })}
                  disabled={submitting}
                  aria-label={`Retirer le tag ${tag}`}
                >
                  #{tag}
                  <Icon name="close" size={14} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* ----------------------------------------------------------- medias */}
      {mode === 'create' ? (
        <>
          <ImageUploader
            bucket="posts"
            userId={userId}
            multiple
            maxFiles={IMAGES_MAX}
            label={`Images (jusqu'a ${IMAGES_MAX}, facultatif)`}
            hint="Les images partent immediatement : elles sont conservees si l'envoi de la publication echoue."
            existing={value.images}
            onUploaded={(images) => patch({ images })}
            disabled={submitting}
          />

          <div className={s.block}>
            <Input
              type="url"
              label="Lien video (facultatif)"
              value={value.videoUrl}
              placeholder="https://www.youtube.com/watch?v=..."
              hint={VIDEO_LINK_HINT}
              error={videoRaw ? videoError : null}
              onChange={(event) => patch({ videoUrl: event.target.value })}
              disabled={submitting}
              iconLeft={<Icon name="video" size={16} />}
              autoCapitalize="none"
              spellCheck={false}
              inputMode="url"
            />

            {video ? (
              <div className={s.videoPreview}>
                {video.thumbnailUrl ? (
                  <img className={s.videoThumb} src={video.thumbnailUrl} alt="" loading="lazy" />
                ) : (
                  <span className={s.videoFallback} aria-hidden="true">
                    <Icon name="play" size={22} />
                  </span>
                )}
                <div className={s.videoText}>
                  <Badge tone="accent" size="sm" icon={<Icon name="check" size={12} />}>
                    {video.label}
                  </Badge>
                  <span className={s.videoUrl}>{video.canonicalUrl}</span>
                  {video.thumbnailUrl ? null : (
                    <span className={s.videoNote}>
                      Twitch n'expose pas de miniature publique : le lien s'affichera avec
                      cette carte de lecture.
                    </span>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <p className={s.note} role="note">
          <Icon name="info" size={16} />
          Les images et le lien video d'une publication deja envoyee ne sont pas
          modifiables ici.
        </p>
      )}

      {error ? (
        <p className={s.error} role="alert">
          <Icon name="alert" size={16} />
          {error}
        </p>
      ) : null}

      <div className={s.actions}>
        <Button type="submit" variant="primary" size="lg" loading={submitting} fullWidth>
          {submitLabel}
        </Button>
        <Button variant="ghost" size="lg" onClick={onCancel} disabled={submitting} fullWidth>
          Annuler
        </Button>
      </div>
    </form>
  )
}
