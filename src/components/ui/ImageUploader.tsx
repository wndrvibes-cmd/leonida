import { useEffect, useId, useRef, useState, type DragEvent } from 'react'
import { ACCEPTED_IMAGE_ACCEPT, UPLOAD_LIMITS, type BucketName } from '@/lib/constants'
import { readableError } from '@/lib/supabase'
import { deleteUpload, uploadImage, uploadImages, validateImageFile, type UploadedImage } from '@/lib/upload'
import { Button } from './Button'
import { Icon } from './Icon'
import { Spinner } from './Spinner'
import { cx } from './cx'
import s from './ImageUploader.module.css'

export interface ImageUploaderProps {
  /** Bucket de destination ; impose la limite de poids affichee. */
  bucket: BucketName
  /** Identifiant du membre : premier segment du chemin « <userId>/<uuid>.<ext> ». */
  userId: string | null | undefined
  multiple?: boolean
  maxFiles?: number
  /** Appele apres chaque envoi ou suppression avec la liste complete a jour. */
  onUploaded: (images: UploadedImage[]) => void
  /** Images deja attachees (edition d'un contenu existant). */
  existing?: UploadedImage[]
  label?: string
  hint?: string
  disabled?: boolean
  className?: string
}

/**
 * Zone de depot reliee a `@/lib/upload` : les fichiers partent reellement
 * dans Supabase Storage. La validation cliente est indicative, la limite reelle
 * est appliquee par le bucket et par la RLS Storage.
 */
export function ImageUploader({
  bucket,
  userId,
  multiple = false,
  maxFiles = multiple ? 4 : 1,
  onUploaded,
  existing = [],
  label = 'Images',
  hint,
  disabled = false,
  className,
}: ImageUploaderProps) {
  const fieldId = useId()
  const libraryInput = useRef<HTMLInputElement>(null)
  const filesInput = useRef<HTMLInputElement>(null)

  const [items, setItems] = useState<UploadedImage[]>(existing)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  // Resynchronise si le parent change la liste (chargement d'un brouillon).
  const existingKey = existing.map((image) => image.path).join('|')
  const lastKey = useRef(existingKey)
  useEffect(() => {
    if (lastKey.current !== existingKey) {
      lastKey.current = existingKey
      setItems(existing)
    }
  }, [existingKey, existing])

  const limit = UPLOAD_LIMITS[bucket]
  const full = items.length >= maxFiles
  const locked = disabled || busy || !userId

  const commit = (next: UploadedImage[]) => {
    lastKey.current = next.map((image) => image.path).join('|')
    setItems(next)
    onUploaded(next)
  }

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setError(null)

    if (!userId) {
      setError('Connectez-vous pour envoyer une image.')
      return
    }

    const room = maxFiles - items.length
    if (room <= 0) {
      setError(`Vous avez atteint la limite de ${maxFiles} image${maxFiles > 1 ? 's' : ''}.`)
      return
    }

    const selected = Array.from(fileList).slice(0, multiple ? room : 1)

    try {
      selected.forEach((file) => validateImageFile(file, bucket))
    } catch (validationError) {
      setError(readableError(validationError))
      return
    }

    setBusy(true)
    setProgress({ done: 0, total: selected.length })
    try {
      const uploaded =
        selected.length > 1
          ? await uploadImages(selected, bucket, userId, (done, total) =>
              setProgress({ done, total }),
            )
          : [await uploadImage(selected[0], bucket, userId)]

      commit(multiple ? [...items, ...uploaded] : uploaded)
    } catch (uploadErr) {
      setError(readableError(uploadErr))
    } finally {
      setBusy(false)
      setProgress({ done: 0, total: 0 })
      if (libraryInput.current) libraryInput.current.value = ''
      if (filesInput.current) filesInput.current.value = ''
    }
  }

  const handleRemove = async (image: UploadedImage) => {
    setError(null)
    setRemoving(image.path)
    try {
      await deleteUpload(image.bucket, image.path)
      commit(items.filter((candidate) => candidate.path !== image.path))
    } catch (removeError) {
      setError(readableError(removeError))
    } finally {
      setRemoving(null)
    }
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    if (locked || full) return
    void handleFiles(event.dataTransfer.files)
  }

  const percent = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <div className={cx(s.wrap, className)}>
      <div className={s.labelRow}>
        <span className={s.label} id={`${fieldId}-label`}>
          {label}
        </span>
        <span className={s.counter}>
          {items.length} / {maxFiles}
        </span>
      </div>

      <div
        className={cx(s.drop, dragging && s.dragging, locked && s.locked)}
        onDragOver={(event) => {
          event.preventDefault()
          if (!locked && !full) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        role="group"
        aria-labelledby={`${fieldId}-label`}
        aria-describedby={`${fieldId}-hint`}
      >
        <span className={s.dropIcon} aria-hidden="true">
          <Icon name={busy ? 'upload' : 'image'} size={24} />
        </span>

        {busy ? (
          <div className={s.progress}>
            <Spinner size="sm" label="Envoi en cours…" />
            <span className={s.progressText}>
              Envoi {progress.done} / {progress.total}
            </span>
            <span className={s.bar}>
              <span className={s.barFill} style={{ width: `${percent}%` }} />
            </span>
          </div>
        ) : (
          <>
            <p className={s.dropText}>
              {full
                ? 'Limite atteinte. Supprimez une image pour en ajouter une autre.'
                : 'Deposez une image ici, ou choisissez une source.'}
            </p>
            <div className={s.actions}>
              <Button
                size="sm"
                variant="secondary"
                iconLeft={<Icon name="camera" size={16} />}
                disabled={locked || full}
                onClick={() => libraryInput.current?.click()}
              >
                Photothèque
              </Button>
              <Button
                size="sm"
                variant="ghost"
                iconLeft={<Icon name="upload" size={16} />}
                disabled={locked || full}
                onClick={() => filesInput.current?.click()}
              >
                Fichiers
              </Button>
            </div>
          </>
        )}

        {/* Deux entrees distinctes : iOS propose la photothèque pour la
            premiere, l'explorateur de fichiers pour la seconde. */}
        <input
          ref={libraryInput}
          className="sr-only"
          type="file"
          accept="image/*"
          multiple={multiple}
          disabled={locked || full}
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => void handleFiles(event.target.files)}
        />
        <input
          ref={filesInput}
          className="sr-only"
          type="file"
          accept={ACCEPTED_IMAGE_ACCEPT}
          multiple={multiple}
          disabled={locked || full}
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => void handleFiles(event.target.files)}
        />
      </div>

      <p className={s.hint} id={`${fieldId}-hint`}>
        {hint ?? `JPEG, PNG, WebP ou AVIF — ${limit.label} maximum par image.`}
        {userId ? '' : ' Connexion requise.'}
      </p>

      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : null}

      {items.length > 0 ? (
        <ul className={s.grid}>
          {items.map((image) => (
            <li className={s.cell} key={image.path}>
              <img className={s.preview} src={image.url} alt="" loading="lazy" decoding="async" />
              <button
                type="button"
                className={s.remove}
                onClick={() => void handleRemove(image)}
                disabled={disabled || removing === image.path}
                aria-label="Supprimer cette image"
              >
                {removing === image.path ? (
                  <Spinner size="sm" silent />
                ) : (
                  <Icon name="trash" size={16} />
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
