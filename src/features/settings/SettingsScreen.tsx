import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Icon, Tabs, type TabItem } from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import { AccessibilitySettings } from './AccessibilitySettings'
import { AccountSettings } from './AccountSettings'
import { AppearanceSettings } from './AppearanceSettings'
import { NotificationSettings } from './NotificationSettings'
import { ProfileSettings } from './ProfileSettings'
import { SubscriptionSettings } from './SubscriptionSettings'
import s from './SettingsScreen.module.css'

const PANELS = [
  { value: 'profil',        label: 'Profil',        icon: 'user' as const,     render: () => <ProfileSettings /> },
  { value: 'apparence',     label: 'Apparence',     icon: 'image' as const,    render: () => <AppearanceSettings /> },
  { value: 'notifications', label: 'Notifications', icon: 'bell' as const,     render: () => <NotificationSettings /> },
  { value: 'accessibilite', label: 'Accessibilité', icon: 'eye' as const,      render: () => <AccessibilitySettings /> },
  { value: 'abonnement',    label: 'Abonnement',    icon: 'crown' as const,    render: () => <SubscriptionSettings /> },
  { value: 'compte',        label: 'Compte',        icon: 'shield' as const,   render: () => <AccountSettings /> },
]

const DEFAULT_PANEL = PANELS[0].value

/**
 * Parametres du membre.
 *
 * L'onglet actif vit dans l'URL (`?onglet=`) et non dans un etat local : un
 * lien vers un reglage precis reste partageable, le bouton Retour du
 * navigateur fonctionne, et un rechargement ne ramene pas au premier onglet.
 */
export function SettingsScreen() {
  const [params, setParams] = useSearchParams()
  const { profile } = useAuth()

  const requested = params.get('onglet')
  const active = PANELS.some((p) => p.value === requested) ? (requested as string) : DEFAULT_PANEL

  const items = useMemo<TabItem[]>(
    () =>
      PANELS.map((p) => ({
        value: p.value,
        label: p.label,
        icon: <Icon name={p.icon} size={16} />,
      })),
    [],
  )

  function selectPanel(value: string) {
    const next = new URLSearchParams(params)
    if (value === DEFAULT_PANEL) next.delete('onglet')
    else next.set('onglet', value)
    setParams(next, { replace: true })
  }

  const panel = PANELS.find((p) => p.value === active) ?? PANELS[0]

  return (
    <div className={`page ${s.screen}`}>
      <header className={s.head}>
        <h1 className={s.title}>Paramètres</h1>
        <p className={s.subtitle}>
          {profile?.username
            ? `Réglages du compte @${profile.username}.`
            : 'Réglages de votre compte.'}
        </p>
      </header>

      {/* La barre d'onglets defile horizontalement sur mobile plutot que de
          se replier : on garde les six destinations visibles d'un coup d'oeil. */}
      <div className={`scroll-x ${s.tabs}`}>
        <Tabs items={items} value={active} onChange={selectPanel} ariaLabel="Sections des paramètres" />
      </div>

      <div className={s.panel} key={panel.value}>
        {panel.render()}
      </div>
    </div>
  )
}

export default SettingsScreen
