import { useEffect, useId, useState, type CSSProperties } from 'react'
import {
  Button, ConfirmDialog, Icon, ImageUploader, Switch, useToast,
} from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import { deleteUpload, type UploadedImage } from '@/lib/upload'
import { publicUrl, readableError } from '@/lib/supabase'
import { SettingsSection } from './SettingsSection'
import { useUpdateUserSettings } from './useUserSettings'
import s from './AppearanceSettings.module.css'

/** Bornes exactes des contraintes CHECK de `user_settings`. */
const SCALE_MIN = 1
const SCALE_MAX = 3
const DIM_MIN = 0
const DIM_MAX = 0.95
/** En dessous de ce voile, le texte clair devient difficile a lire. */
const DIM_READABLE = 0.35

/** Les neuf ancrages de `background-position`, dans l'ordre de la grille. */
const ANCHORS: { value: string; label: string }[] = [
  { value: 'left top', label: 'En haut a gauche' },
  { value: 'center top', label: 'En haut' },
  { value: 'right top', label: 'En haut a droite' },
  { value: 'left center', label: 'A gauche' },
  { value: 'center', label: 'Centre' },
  { value: 'right center', label: 'A droite' },
  { value: 'left bottom', label: 'En bas a gauche' },
  { value: 'center bottom', label: 'En bas' },
  { value: 'right bottom', label: 'En bas a droite' },
]

interface Draft {
  path: string | null
  position: string
  scale: number
  dim: number
}

const FALLBACK: Draft = { path: null, position: 'center', scale: 1, dim: 0.55 }

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Onglet « Apparence » : fond d'application personnalise.
 *
 * La previsualisation est locale et immediate ; l'application entiere ne
 * change qu'après enregistrement, car c'est `useAppBackground()` — branche sur
 * la ligne `user_settings` du AuthProvider — qui pose reellement l'image.
 *
 * `background_url` contient un CHEMIN du bucket `backgrounds` (c'est ce que
 * `useAppBackground` resout avec `publicUrl`), jamais une URL complete.
 */
export function AppearanceSettings() {
  const toast = useToast()
  const { user, settings, isSuspended } = useAuth()
  const update = useUpdateUserSettings()

  const [draft, setDraft] = useState<Draft>(FALLBACK)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const scaleId = useId()
  const dimId = useId()

  useEffect(() => {
    if (!settings) return
    setDraft({
      path: settings.background_url,
      position: settings.background_position || 'center',
      scale: clamp(settings.background_scale, SCALE_MIN, SCALE_MAX),
      dim: clamp(settings.background_dim, DIM_MIN, DIM_MAX),
    })
  }, [settings])

  const enabled = settings?.background_enabled ?? false
  const previewUrl = publicUrl('backgrounds', draft.path)

  const dirty =
    Boolean(settings) &&
    (draft.path !== settings?.background_url ||
      draft.position !== (settings?.background_position || 'center') ||
      draft.scale !== settings?.background_scale ||
      draft.dim !== settings?.background_dim)

  const previewStyle = {
    '--preview-image': previewUrl ? `url("${previewUrl}")` : 'none',
    '--preview-position': draft.position,
    '--preview-scale': String(draft.scale),
    '--preview-dim': String(draft.dim),
  } as CSSProperties

  function patch(next: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...next }))
  }

  function handleUploaded(images: UploadedImage[]) {
    const first = images[0]
    if (first) patch({ path: first.path })
  }

  function saveDraft() {
    update.mutate(
      {
        background_url: draft.path,
        background_position: draft.position,
        background_scale: draft.scale,
        background_dim: draft.dim,
        // Deposer une image et devoir penser a activer l'option serait un
        // piege : la premiere image activee active le fond.
        background_enabled: Boolean(draft.path),
      },
      {
        onSuccess: () => toast.success('Fond enregistre'),
        onError: (error) => toast.error('Enregistrement impossible', readableError(error)),
      },
    )
  }

  function toggleEnabled(next: boolean) {
    update.mutate(
      { background_enabled: next },
      {
        onError: (error) => toast.error('Réglage non enregistre', readableError(error)),
      },
    )
  }

  function removeBackground() {
    const previous = settings?.background_url ?? null

    update.mutate(
      { background_url: null, background_enabled: false },
      {
        onSuccess: async () => {
          setConfirmRemove(false)
          patch({ path: null })
          toast.success('Fond retire')

          // Le fichier n'a plus aucune reference : on le supprime du bucket.
          if (previous && !/^https?:\/\//i.test(previous)) {
            try {
              await deleteUpload('backgrounds', previous)
            } catch {
              // Fichier orphelin : sans consequence pour le membre.
            }
          }
        },
        onError: (error) => {
          setConfirmRemove(false)
          toast.error('Retrait impossible', readableError(error))
        },
      },
    )
  }

  if (!settings) {
    return (
      <SettingsSection title="Personnaliser mon fond" icon="image">
        <p className={s.note}>
          Vos réglages ne sont pas encore charges. Rechargez la page : aucune valeur
          n'est affichée avant d'être connue.
        </p>
      </SettingsSection>
    )
  }

  return (
    <div className={s.wrap}>
      <SettingsSection
        title="Personnaliser mon fond"
        icon="image"
        description="Votre image derriere toute l'application, avec un voile sombre reglable pour que le texte reste lisible."
        footnote="JPEG, PNG, WebP ou AVIF, 8 Mo maximum. Votre image n'est visible que par vous."
      >
        <div
          className={s.preview}
          style={previewStyle}
          data-has-image={previewUrl ? 'true' : 'false'}
        >
          <span className={s.previewImage} aria-hidden="true" />
          <span className={s.previewScrim} aria-hidden="true" />
          <div className={s.previewContent}>
            <p className={s.previewTitle}>Apercu</p>
            <p className={s.previewText}>
              {previewUrl
                ? 'Ce texte doit rester parfaitement lisible par-dessus votre image.'
                : "Aucune image choisie : l'application garde son fond nuit tropicale."}
            </p>
          </div>
        </div>

        {draft.dim < DIM_READABLE && previewUrl ? (
          <p className={s.warning} role="status">
            <Icon name="alert" size={16} />
            <span>
              Avec un voile aussi leger, le texte peut devenir difficile a lire sur une
              image claire ou chargée. Augmentez le voile si l'apercu ci-dessus n'est pas
              net.
            </span>
          </p>
        ) : null}

        <ImageUploader
          bucket="backgrounds"
          userId={user?.id}
          label="Image de fond"
          hint="L'image part immédiatement ; le cadrage et le voile s'appliquent après enregistrement."
          disabled={isSuspended}
          onUploaded={handleUploaded}
        />
      </SettingsSection>

      <SettingsSection
        title="Cadrage et lisibilite"
        icon="target"
        description="Choisissez le point d'ancrage de l'image, son agrandissement et l'intensite du voile."
      >
        <fieldset className={s.fieldset}>
          <legend className={s.legend}>Position</legend>
          {/* Boutons bascules plutot que `role="radio"` : un vrai groupe radio
              impose la navigation aux fleches, que l'on n'implemente pas ici.
              `aria-pressed` decrit donc exactement ce qui est rendu. */}
          <div className={s.anchors} role="group" aria-label="Position de l'image">
            {ANCHORS.map((anchor) => (
              <button
                key={anchor.value}
                type="button"
                aria-pressed={draft.position === anchor.value}
                aria-label={anchor.label}
                title={anchor.label}
                className={
                  draft.position === anchor.value ? `${s.anchor} ${s.anchorOn}` : s.anchor
                }
                onClick={() => patch({ position: anchor.value })}
                disabled={!draft.path}
              >
                <span className={s.anchorDot} aria-hidden="true" />
              </button>
            ))}
          </div>
        </fieldset>

        <div className={s.slider}>
          <label className={s.sliderLabel} htmlFor={scaleId}>
            Zoom
            <output className={s.sliderValue} htmlFor={scaleId}>
              {draft.scale.toFixed(2)}×
            </output>
          </label>
          <input
            id={scaleId}
            className={s.range}
            type="range"
            min={SCALE_MIN}
            max={SCALE_MAX}
            step={0.05}
            value={draft.scale}
            disabled={!draft.path}
            onChange={(event) => patch({ scale: Number(event.target.value) })}
          />
          <p className={s.sliderHint}>De 1 (image entiere) a 3 (fort agrandissement).</p>
        </div>

        <div className={s.slider}>
          <label className={s.sliderLabel} htmlFor={dimId}>
            Voile sombre
            <output className={s.sliderValue} htmlFor={dimId}>
              {Math.round(draft.dim * 100)} %
            </output>
          </label>
          <input
            id={dimId}
            className={s.range}
            type="range"
            min={DIM_MIN}
            max={DIM_MAX}
            step={0.05}
            value={draft.dim}
            disabled={!draft.path}
            onChange={(event) => patch({ dim: Number(event.target.value) })}
          />
          <p className={s.sliderHint}>
            Maximum 95 % : le fond reste toujours legerement visible.
          </p>
        </div>

        <div className={s.actions}>
          <Button
            onClick={saveDraft}
            loading={update.isPending}
            disabled={!dirty || isSuspended}
            iconLeft={<Icon name="check" size={18} />}
          >
            Enregistrer le fond
          </Button>

          {dirty ? (
            <Button
              variant="ghost"
              onClick={() =>
                setDraft({
                  path: settings.background_url,
                  position: settings.background_position || 'center',
                  scale: clamp(settings.background_scale, SCALE_MIN, SCALE_MAX),
                  dim: clamp(settings.background_dim, DIM_MIN, DIM_MAX),
                })
              }
              iconLeft={<Icon name="refresh" size={18} />}
            >
              Annuler les modifications
            </Button>
          ) : null}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Affichage du fond"
        icon="eye"
        description="Vous pouvez desactiver votre fond sans perdre votre image ni vos réglages."
      >
        <Switch
          checked={enabled}
          onChange={toggleEnabled}
          busy={update.isPending}
          disabled={!settings.background_url}
          label="Afficher mon fond personnalise"
          description={
            settings.background_url
              ? "L'image s'applique a toute l'application, sur tous vos appareils."
              : "Importez d'abord une image : il n'y a rien a afficher pour l'instant."
          }
        />

        {settings.background_url ? (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setConfirmRemove(true)}
            iconLeft={<Icon name="trash" size={16} />}
          >
            Retirer le fond
          </Button>
        ) : null}
      </SettingsSection>

      <ConfirmDialog
        open={confirmRemove}
        title="Retirer votre fond ?"
        message="Votre image sera définitivement supprimée du stockage et l'application reprendra son fond d'origine. Cette action est irréversible."
        confirmLabel="Retirer le fond"
        loading={update.isPending}
        onConfirm={removeBackground}
        onCancel={() => setConfirmRemove(false)}
      />
    </div>
  )
}
