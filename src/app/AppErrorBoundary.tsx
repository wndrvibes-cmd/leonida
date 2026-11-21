import { Component, type ErrorInfo, type ReactNode } from 'react'
import { readableError } from '@/lib/supabase'
import s from './AppErrorBoundary.module.css'

interface Props { children: ReactNode }
interface State { error: Error | null }

/**
 * Dernier filet de securite : si un ecran leve une exception non rattrapee,
 * on affiche un message honnete plutot qu'une page blanche.
 *
 * Ce composant ne remplace PAS la gestion d'erreur de chaque ecran (chaque
 * requete doit afficher son propre message via `readableError`).
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Aucun service de supervision n'est branche : on trace en console.
    console.error('[LEONIDA] erreur non rattrapee', error, info.componentStack)
  }

  private reset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className={s.wrap} role="alert">
        <div className={s.card}>
          <p className={s.kicker}>Erreur inattendue</p>
          <h1 className={s.title}>L'application a rencontre un problème</h1>
          <p className={s.body}>{readableError(error)}</p>
          <div className={s.actions}>
            <button type="button" className={s.primary} onClick={this.reset}>
              Réessayer
            </button>
            <a className={s.secondary} href="/">Retour a l'accueil</a>
          </div>
        </div>
      </div>
    )
  }
}
