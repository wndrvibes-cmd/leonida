import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, Icon, Modal } from '@/components/ui'
import type { MapCategory } from '@/services/map'
import { ContributionForm } from './ContributionForm'
import type { ContributeFlow } from './useContributeFlow'
import s from './ContributeFlow.module.css'

/**
 * Interface de la contribution LEONIDA+. La machine a etats vit dans
 * `useContributeFlow` ; ce fichier n'en affiche que les etapes.
 *
 * Aucun bouton mort : hors abonnement, l'action n'est pas simulee — elle est
 * remplacee par une explication et un vrai lien vers l'offre.
 */

export function ContributeButton({ flow }: { flow: ContributeFlow }) {
  const active = flow.step !== 'idle'
  return (
    <Button
      variant="premium"
      size="md"
      onClick={flow.start}
      disabled={active}
      iconLeft={<Icon name="plus" size={18} />}
    >
      Ajouter une decouverte
    </Button>
  )
}

/** Bandeau du mode placement, pose au-dessus de la carte. */
export function PlacementBanner({ flow }: { flow: ContributeFlow }) {
  if (flow.step !== 'placing') return null
  const placed = flow.point !== null

  return (
    <div className={s.banner} role="status">
      <div className={s.bannerText}>
        <Icon name={placed ? 'check' : 'target'} size={18} />
        <span>
          {placed
            ? 'Repere pose. Faites-le glisser pour l\'ajuster au bon endroit.'
            : 'Touchez la carte pour placer votre decouverte.'}
        </span>
      </div>
      <div className={s.bannerActions}>
        <Button variant="ghost" size="sm" onClick={flow.cancel}>
          Annuler
        </Button>
        <Button variant="primary" size="sm" onClick={flow.confirmPosition} disabled={!placed}>
          Continuer
        </Button>
      </div>
    </div>
  )
}

/** Explication affichee a un visiteur, ou a un membre sans LEONIDA+. */
function AccessGate({ flow }: { flow: ContributeFlow }) {
  const location = useLocation()
  const navigate = useNavigate()

  if (flow.isAuthenticated) {
    return (
      <div className={s.gate}>
        <span className={s.gateMark} aria-hidden="true">
          <Icon name="crown" size={26} />
        </span>
        <h3 className={s.gateTitle}>Proposer une decouverte, c'est LEONIDA+</h3>
        <p className={s.gateBody}>
          Les contributions a la carte sont reservees aux membres LEONIDA+. Vos
          decouvertes sont relues par l'equipe, puis publiees avec votre nom
          d'auteur et leur niveau de verification.
        </p>
        <div className={s.gateActions}>
          <Button as="link" to="/premium" variant="premium" size="lg" fullWidth>
            Decouvrir LEONIDA+
          </Button>
          <Button variant="ghost" size="lg" onClick={flow.cancel} fullWidth>
            Plus tard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={s.gate}>
      <span className={s.gateMark} aria-hidden="true">
        <Icon name="user" size={26} />
      </span>
      <h3 className={s.gateTitle}>Connectez-vous pour contribuer</h3>
      <p className={s.gateBody}>
        Les decouvertes de la carte sont signees par leur auteur. Connectez-vous
        pour proposer la votre.
      </p>
      <div className={s.gateActions}>
        {/* Navigation programmee plutot qu'un lien : elle transmet la page
            courante, pour que la connexion ramene ici et non a l'accueil. */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => navigate('/connexion', { state: { from: location } })}
        >
          Se connecter
        </Button>
        <Button as="link" to="/inscription" variant="ghost" size="lg" fullWidth>
          Creer un compte
        </Button>
      </div>
      <p className={s.gateFoot}>
        <Link to="/premium" className={s.gateLink}>
          Voir ce qu'apporte LEONIDA+
        </Link>
      </p>
    </div>
  )
}

/** Message de fin : ce qui va reellement se passer apres l'envoi. */
function SentPanel({ flow }: { flow: ContributeFlow }) {
  return (
    <div className={s.gate}>
      <span className={`${s.gateMark} ${s.gateMarkOk}`} aria-hidden="true">
        <Icon name="check" size={26} />
      </span>
      <h3 className={s.gateTitle}>
        {flow.editing ? 'Correction enregistree' : 'Decouverte envoyee'}
      </h3>
      <p className={s.gateBody}>
        Elle est en file de validation. L'equipe la relit, puis elle apparait sur
        la carte publique une fois approuvee — pas avant. Vous suivez son statut
        dans l'onglet « Mes contributions », et vous recevrez une notification
        des qu'une decision est prise.
      </p>
      <div className={s.gateActions}>
        <Button variant="primary" size="lg" onClick={flow.cancel} fullWidth>
          Terminer
        </Button>
      </div>
    </div>
  )
}

export interface ContributeDialogProps {
  flow: ContributeFlow
  categories: MapCategory[]
  userId: string | null
}

/**
 * Calque de contribution : portail d'acces, formulaire, confirmation.
 * Le mode placement n'affiche rien ici — la carte doit rester visible.
 */
export function ContributeDialog({ flow, categories, userId }: ContributeDialogProps) {
  const open = flow.step === 'gate' || flow.step === 'form' || flow.step === 'sent'

  const title = flow.step === 'form'
    ? (flow.editing ? 'Corriger ma decouverte' : 'Decrire votre decouverte')
    : undefined

  return (
    <Modal
      open={open}
      onClose={flow.cancel}
      title={title}
      ariaLabel={title ? undefined : 'Contribuer a la carte'}
      description={
        flow.step === 'form'
          ? 'Toute contribution passe par la validation de l\'equipe avant publication.'
          : undefined
      }
      size={flow.step === 'form' ? 'md' : 'sm'}
      disableBackdropClose={flow.submitting}
    >
      {flow.step === 'gate' ? <AccessGate flow={flow} /> : null}
      {flow.step === 'sent' ? <SentPanel flow={flow} /> : null}
      {flow.step === 'form' && flow.point && userId ? (
        <ContributionForm
          categories={categories}
          userId={userId}
          point={flow.point}
          initial={flow.editing ? {
            title: flow.editing.title,
            categoryId: flow.editing.category_id,
            description: flow.editing.description ?? '',
            instructions: flow.editing.instructions ?? '',
            estimatedReward: flow.editing.estimated_reward ?? '',
            authorTested: flow.editing.author_tested,
            imageUrl: flow.editing.image_url,
          } : undefined}
          submitting={flow.submitting}
          error={flow.error}
          submitLabel={flow.editing ? 'Enregistrer la correction' : 'Envoyer en validation'}
          onSubmit={flow.submit}
          onCancel={flow.cancel}
          onReposition={flow.reposition}
        />
      ) : null}
    </Modal>
  )
}
