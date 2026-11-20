import { useState, type FormEvent } from 'react'
import {
  Button, Icon, ImageUploader, Input, Select, Switch, Textarea,
} from '@/components/ui'
import { readableError } from '@/lib/supabase'
import type { MapCategory } from '@/services/map'
import type { RelativePoint } from './types'
import s from './ContributionForm.module.css'

/**
 * Formulaire d'une contribution carte. Sert aussi bien au depot initial
 * qu'a la correction d'une contribution refusee ou encore en attente.
 *
 * Le controle premium et le passage en file de validation sont imposes par la
 * base (RLS + declencheur `tg_protect_marker_fields`) : ce formulaire ne fait
 * que guider, il ne decide rien.
 */

export interface ContributionValues {
  title: string
  categoryId: string | null
  description: string
  instructions: string
  estimatedReward: string
  authorTested: boolean
  imageUrl: string | null
}

export interface ContributionFormProps {
  categories: MapCategory[]
  userId: string
  /** Position retenue, en coordonnees relatives 0..1. */
  point: RelativePoint
  initial?: Partial<ContributionValues>
  submitting: boolean
  error: unknown
  submitLabel: string
  onSubmit: (values: ContributionValues) => void
  onCancel: () => void
  /** Propose de revenir sur la carte pour deplacer le repere. */
  onReposition?: () => void
}

const TITLE_MAX = 90
const DESCRIPTION_MAX = 1200
const INSTRUCTIONS_MAX = 1200
const REWARD_MAX = 80

export function ContributionForm(props: ContributionFormProps) {
  const {
    categories, userId, point, initial, submitting, error,
    submitLabel, onSubmit, onCancel, onReposition,
  } = props

  const [title, setTitle] = useState(initial?.title ?? '')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [instructions, setInstructions] = useState(initial?.instructions ?? '')
  const [estimatedReward, setEstimatedReward] = useState(initial?.estimatedReward ?? '')
  const [authorTested, setAuthorTested] = useState(initial?.authorTested ?? false)
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null)
  const [replacingImage, setReplacingImage] = useState(false)
  const [titleError, setTitleError] = useState<string>()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = title.trim()
    if (trimmed.length < 3) {
      setTitleError('Donnez un titre d\'au moins 3 caracteres.')
      return
    }
    setTitleError(undefined)
    onSubmit({
      title: trimmed,
      categoryId: categoryId || null,
      description,
      instructions,
      estimatedReward,
      authorTested,
      imageUrl,
    })
  }

  return (
    <form className={s.form} onSubmit={handleSubmit} noValidate>
      {error ? (
        <p className={s.alert} role="alert">
          <Icon name="alert" size={18} />
          <span>{readableError(error)}</span>
        </p>
      ) : null}

      <p className={s.position}>
        <Icon name="pin" size={16} />
        <span>
          Position retenue : {(point.x * 100).toFixed(1)} % / {(point.y * 100).toFixed(1)} %
          de la carte.
        </span>
        {onReposition ? (
          <button type="button" className={s.reposition} onClick={onReposition}>
            Deplacer le repere
          </button>
        ) : null}
      </p>

      <Input
        label="Titre"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        error={titleError}
        maxLength={TITLE_MAX}
        placeholder="Ex. : garage abandonne du port"
        required
      />

      <Select
        label="Categorie"
        value={categoryId}
        onChange={(event) => setCategoryId(event.target.value)}
        placeholder="Choisir une categorie"
        options={categories.map((category) => ({ value: category.id, label: category.label }))}
        hint={
          categories.length === 0
            ? "Aucune categorie n'est encore definie par l'equipe."
            : undefined
        }
        disabled={categories.length === 0}
      />

      <Textarea
        label="Description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={4}
        maxLength={DESCRIPTION_MAX}
        showCount
        placeholder="Ce que l'on trouve sur place, et pourquoi cela vaut le detour."
      />

      <Textarea
        label="Comment s'y rendre"
        value={instructions}
        onChange={(event) => setInstructions(event.target.value)}
        rows={4}
        maxLength={INSTRUCTIONS_MAX}
        showCount
        hint="Itineraire, moment de la journee, conditions particulieres."
      />

      <Input
        label="Recompense estimee"
        value={estimatedReward}
        onChange={(event) => setEstimatedReward(event.target.value)}
        maxLength={REWARD_MAX}
        placeholder="Ex. : une arme, un vehicule, de l'argent"
        hint="Facultatif. Elle sera clairement presentee comme une estimation de votre part."
      />

      <Switch
        checked={authorTested}
        onChange={setAuthorTested}
        label="J'ai teste cette decouverte moi-meme"
        description="Declaration honnete : elle est affichee aux autres membres, et l'equipe la verifie avant toute validation."
      />

      {imageUrl && !replacingImage ? (
        <div className={s.imageBlock}>
          <img className={s.imagePreview} src={imageUrl} alt="Illustration de la decouverte" />
          <div className={s.imageActions}>
            <Button variant="secondary" size="sm" onClick={() => setReplacingImage(true)}>
              Remplacer l'image
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setImageUrl(null)}>
              Retirer l'image
            </Button>
          </div>
        </div>
      ) : (
        <ImageUploader
          bucket="contributions"
          userId={userId}
          label="Image (facultative)"
          hint="Une capture du lieu aide beaucoup l'equipe a valider votre decouverte."
          onUploaded={(images) => {
            setImageUrl(images[0]?.url ?? null)
            setReplacingImage(false)
          }}
        />
      )}

      <div className={s.actions}>
        <Button type="submit" variant="premium" size="lg" loading={submitting} fullWidth>
          {submitLabel}
        </Button>
        <Button variant="ghost" size="lg" onClick={onCancel} disabled={submitting} fullWidth>
          Annuler
        </Button>
      </div>
    </form>
  )
}

export default ContributionForm
