import { useState } from 'react'
import { Button, Icon, Switch, useToast } from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import { readableError } from '@/lib/supabase'
import { INTRO_SESSION_KEY } from '@/components/brand/Intro'
import { SettingsSection } from './SettingsSection'
import { useUpdateUserSettings } from './useUserSettings'
import s from './AccessibilitySettings.module.css'

/**
 * Confort de lecture et de mouvement.
 *
 * Le reglage « reduire les animations » ne fait pas que ralentir : il met les
 * durees de `tokens.css` a zero ET coupe les animations pilotees en
 * JavaScript. Il s'ajoute a `prefers-reduced-motion` du systeme sans le
 * remplacer : si le systeme demande deja la reduction, l'interrupteur ne peut
 * pas la desactiver.
 */
export function AccessibilitySettings() {
  const { settings } = useAuth()
  const update = useUpdateUserSettings()
  const toast = useToast()
  const [replaying, setReplaying] = useState(false)

  const systemReduces =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  async function setReduceMotion(next: boolean) {
    try {
      await update.mutateAsync({ reduce_motion: next })
      toast.success(next ? 'Animations réduites' : 'Animations réactivées')
    } catch (error) {
      toast.error(readableError(error))
    }
  }

  async function replayIntro() {
    setReplaying(true)
    try {
      await update.mutateAsync({ show_intro: true, intro_seen_at: null })
      // L'intro consulte aussi sessionStorage pour ne pas se rejouer a chaque
      // navigation : il faut donc effacer les deux sources.
      try {
        window.sessionStorage.removeItem(INTRO_SESSION_KEY)
      } catch {
        // Navigation privee ou stockage refuse : le reglage serveur suffit.
      }
      toast.success(
        'Introduction réactivée',
        'Elle se rejouera au prochain chargement de LEONIDA.',
      )
    } catch (error) {
      toast.error(readableError(error))
    } finally {
      setReplaying(false)
    }
  }

  return (
    <SettingsSection
      title="Accessibilité"
      icon="eye"
      description="Adaptez le mouvement et l'entrée dans l'application à votre confort."
      footnote={
        systemReduces
          ? "Votre système demande déjà la réduction des animations : LEONIDA la respecte, que l'interrupteur ci-dessus soit activé ou non."
          : undefined
      }
    >
      <div className={s.rows}>
        <Switch
          checked={Boolean(settings?.reduce_motion) || systemReduces}
          disabled={systemReduces || update.isPending}
          onChange={setReduceMotion}
          label="Réduire les animations"
          description="Supprime les transitions, les apparitions au défilement et les mouvements de la page d'accueil."
        />

        <div className={s.row}>
          <div className={s.rowText}>
            <span className={s.rowTitle}>Revoir l'introduction</span>
            <span className={s.rowHelp}>
              La séquence d'ouverture ne se joue qu'une fois. Vous pouvez la réactiver.
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            loading={replaying}
            onClick={replayIntro}
            iconLeft={<Icon name="play" size={16} />}
          >
            Rejouer
          </Button>
        </div>
      </div>
    </SettingsSection>
  )
}

export default AccessibilitySettings
