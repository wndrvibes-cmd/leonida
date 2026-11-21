import { useCallback, useEffect, useRef, useState } from 'react'
import { POST_TYPE_LABELS } from '@/lib/constants'
import type { UploadedImage } from '@/lib/upload'
import type { Database } from '@/types/database'

type PostType = Database['public']['Enums']['post_type']

/**
 * Brouillon du composeur, conserve dans le navigateur.
 *
 * POURQUOI : une publication peut porter des images deja televersees dans le
 * bucket. Si l'envoi echoue — reseau coupe, application fermee par erreur —
 * perdre le texte ET les images obligerait a tout refaire. Le brouillon n'est
 * efface qu'apres une publication reellement acceptee par la base.
 *
 * Il reste STRICTEMENT local : rien n'est envoye au serveur, et toute lecture
 * est protegee (navigation privee verrouillee, stockage plein, JSON corrompu).
 */

const STORAGE_KEY = 'leonida:brouillon-communaute'
const DRAFT_VERSION = 1
const SAVE_DELAY = 400

export interface ComposerDraft {
  postType: PostType
  title: string
  body: string
  tags: string[]
  images: UploadedImage[]
  videoUrl: string
}

interface StoredDraft {
  version: number
  savedAt: number
  draft: ComposerDraft
}

export function isDraftEmpty(draft: ComposerDraft): boolean {
  return (
    draft.title.trim() === '' &&
    draft.body.trim() === '' &&
    draft.tags.length === 0 &&
    draft.images.length === 0 &&
    draft.videoUrl.trim() === ''
  )
}

function asString(value: unknown, max: number): string {
  return typeof value === 'string' ? value.slice(0, max) : ''
}

function asPostType(value: unknown): PostType {
  return typeof value === 'string' && value in POST_TYPE_LABELS
    ? (value as PostType)
    : 'discussion'
}

/** Une image n'est reutilisable que si son chemin de bucket est intact. */
function asImage(value: unknown): UploadedImage | null {
  if (typeof value !== 'object' || value === null) return null
  const raw = value as Record<string, unknown>
  if (typeof raw.url !== 'string' || typeof raw.path !== 'string') return null
  if (typeof raw.bucket !== 'string') return null
  return {
    bucket: raw.bucket as UploadedImage['bucket'],
    path: raw.path,
    url: raw.url,
    width: typeof raw.width === 'number' ? raw.width : 0,
    height: typeof raw.height === 'number' ? raw.height : 0,
    sizeBytes: typeof raw.sizeBytes === 'number' ? raw.sizeBytes : 0,
  }
}

function parse(raw: string): StoredDraft | null {
  let decoded: unknown
  try {
    decoded = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof decoded !== 'object' || decoded === null) return null

  const stored = decoded as Record<string, unknown>
  if (stored.version !== DRAFT_VERSION) return null

  const source = (stored.draft ?? {}) as Record<string, unknown>
  const draft: ComposerDraft = {
    postType: asPostType(source.postType),
    title: asString(source.title, 140),
    body: asString(source.body, 8000),
    tags: Array.isArray(source.tags)
      ? source.tags.filter((tag): tag is string => typeof tag === 'string').slice(0, 6)
      : [],
    images: Array.isArray(source.images)
      ? source.images
          .map(asImage)
          .filter((image): image is UploadedImage => image !== null)
          .slice(0, 4)
      : [],
    videoUrl: asString(source.videoUrl, 300),
  }

  if (isDraftEmpty(draft)) return null
  return {
    version: DRAFT_VERSION,
    savedAt: typeof stored.savedAt === 'number' ? stored.savedAt : 0,
    draft,
  }
}

function readStored(): StoredDraft | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? parse(raw) : null
  } catch {
    return null
  }
}

export interface ComposerDraftApi {
  /** Brouillon trouve au montage, `null` s'il n'y en avait pas d'exploitable. */
  restored: ComposerDraft | null
  /** Horodatage du brouillon retrouve, pour l'annoncer au membre. */
  restoredAt: number | null
  /** Enregistrement differe : la frappe n'ecrit pas a chaque caractere. */
  save: (draft: ComposerDraft) => void
  /** Efface le brouillon ET annule l'enregistrement en attente. */
  clear: () => void
  /** `true` si le navigateur refuse le stockage : on le dit plutot que de mentir. */
  unavailable: boolean
}

export function useComposerDraft(): ComposerDraftApi {
  const [initial] = useState(readStored)
  const [unavailable, setUnavailable] = useState(false)

  /**
   * Minuteur maison plutot que `useDebouncedCallback` : `clear()` doit pouvoir
   * ANNULER une ecriture en attente. Sans cela, l'enregistrement differe
   * declenche juste avant une publication reussie reecrirait le brouillon
   * quelques centaines de millisecondes apres son effacement.
   */
  const timer = useRef<number | undefined>(undefined)

  const write = useCallback((draft: ComposerDraft) => {
    try {
      if (isDraftEmpty(draft)) {
        window.localStorage.removeItem(STORAGE_KEY)
        return
      }
      const payload: StoredDraft = { version: DRAFT_VERSION, savedAt: Date.now(), draft }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // Quota depasse ou stockage interdit : le formulaire reste utilisable.
      setUnavailable(true)
    }
  }, [])

  const save = useCallback(
    (draft: ComposerDraft) => {
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => write(draft), SAVE_DELAY)
    },
    [write],
  )

  const clear = useCallback(() => {
    window.clearTimeout(timer.current)
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      setUnavailable(true)
    }
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return {
    restored: initial?.draft ?? null,
    restoredAt: initial?.savedAt ?? null,
    save,
    clear,
    unavailable,
  }
}
