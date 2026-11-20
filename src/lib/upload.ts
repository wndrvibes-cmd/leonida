import { supabase, readableError } from '@/lib/supabase'
import { UPLOAD_LIMITS, ACCEPTED_IMAGE_TYPES, type BucketName } from '@/lib/constants'

export interface UploadedImage {
  bucket: BucketName
  path: string
  url: string
  width: number
  height: number
  sizeBytes: number
}

export class UploadError extends Error {}

/* ------------------------------------------------------------------ check */

export function validateImageFile(file: File, bucket: BucketName): void {
  const limit = UPLOAD_LIMITS[bucket]

  // iOS peut remonter des HEIC que le canvas ne sait pas decoder.
  if (/heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)) {
    throw new UploadError(
      'Les images HEIC ne sont pas prises en charge. Dans Reglages > Appareil photo > ' +
        'Formats, choisissez « Plus compatible », ou exportez la photo en JPEG.',
    )
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new UploadError('Format non accepte. Utilisez JPEG, PNG, WebP ou AVIF.')
  }

  // Controle indicatif cote client : la limite reelle est imposee par le bucket.
  if (file.size > limit.maxBytes * 1.5) {
    throw new UploadError(`Ce fichier est trop volumineux (maximum ${limit.label}).`)
  }
}

/* ------------------------------------------------------------ compression */

/**
 * Reduit l'image avant envoi : economise la bande passante mobile et le quota
 * de stockage. L'orientation EXIF des photos iPhone est respectee grace a
 * `imageOrientation: 'from-image'`.
 */
export async function compressImage(
  file: File,
  { maxDimension = 2200, quality = 0.84 }: { maxDimension?: number; quality?: number } = {},
): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  // Rien a gagner : on garde l'original.
  if (scale === 1 && file.size < 900_000) {
    bitmap.close()
    return { blob: file, width, height }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return { blob: file, width: bitmap.width, height: bitmap.height }
  }

  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', quality),
  )

  // Si la conversion echoue ou grossit le fichier, on conserve l'original.
  if (!blob || blob.size >= file.size) return { blob: file, width, height }
  return { blob, width, height }
}

/* ---------------------------------------------------------------- upload */

/**
 * Televerse reellement dans Supabase Storage.
 *
 * Convention de chemin : `<userId>/<uuid>.<ext>`. Le premier segment doit etre
 * l'identifiant du membre : la policy `storage_owns_path()` le verifie cote
 * serveur, un membre ne peut donc rien ecrire dans le dossier d'un autre.
 */
export async function uploadImage(
  file: File,
  bucket: BucketName,
  userId: string,
  options: { compress?: boolean; maxDimension?: number } = {},
): Promise<UploadedImage> {
  validateImageFile(file, bucket)

  const { compress = true, maxDimension } = options
  const { blob, width, height } = compress
    ? await compressImage(file, { maxDimension })
    : { blob: file as Blob, width: 0, height: 0 }

  const ext = blob.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${userId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    cacheControl: '31536000',
    contentType: blob.type,
    upsert: false,
  })

  if (error) throw new UploadError(readableError(error))

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)

  return { bucket, path, url: data.publicUrl, width, height, sizeBytes: blob.size }
}

/** Supprime un fichier televerse (annulation d'un formulaire, remplacement). */
export async function deleteUpload(bucket: BucketName, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw new UploadError(readableError(error))
}

/** Televerse plusieurs images en limitant la concurrence (reseau mobile). */
export async function uploadImages(
  files: File[],
  bucket: BucketName,
  userId: string,
  onProgress?: (done: number, total: number) => void,
): Promise<UploadedImage[]> {
  const results: UploadedImage[] = []
  for (const [i, file] of files.entries()) {
    results.push(await uploadImage(file, bucket, userId))
    onProgress?.(i + 1, files.length)
  }
  return results
}
