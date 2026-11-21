import { useState } from 'react'
import { Switch, useToast } from '@/components/ui'
import { useAuth } from '@/app/AuthProvider'
import { readableError } from '@/lib/supabase'
import { SettingsSection } from './SettingsSection'
import { useUpdateUserSettings, type UserSettingsPatch } from './useUserSettings'
import s from './NotificationSettings.module.css'

type NotifyKey =
  | 'notify_replies'
  | 'notify_reactions'
  | 'notify_moderation'
  | 'notify_news'
  | 'notify_contests'

/** Ecriture typee : pas de cle calculee, donc pas de `cast` a l'aveugle. */
function patchFor(key: NotifyKey, value: boolean): UserSettingsPatch {
  const patches: Record<NotifyKey, UserSettingsPatch> = {
    notify_replies: { notify_replies: value },
    notify_reactions: { notify_reactions: value },
    notify_moderation: { notify_moderation: value },
    notify_news: { notify_news: value },
    notify_contests: { notify_contests: value },
  }
  return patches[key]
}

interface Item {
  key: NotifyKey
  label: string
  description: string
  /**
   * `true` si la BASE consulte reellement ce reglage avant d'envoyer.
   * Sinon on le dit : le choix est enregistre, mais il ne change encore rien.
   */
  honored: boolean
}

const ITEMS: Item[] = [
  {
    key: 'notify_replies',
    label: 'Réponses a mes messages',
    description:
      'Quand un membre répond a votre commentaire ou commente votre publication.',
    honored: true,
  },
  {
    key: 'notify_reactions',
    label: 'Réactions a mes contenus',
    description: 'Quand un membre reagit a une de vos publications.',
    honored: false,
  },
  {
    key: 'notify_moderation',
    label: 'Decisions de modération',
    description:
      'Quand une de vos découvertes est validée ou refusée, ou qu\'un signalement vous concernant est traite.',
    honored: false,
  },
  {
    key: 'notify_news',
    label: 'Nouvelles actualités',
    description: 'Quand un article important est publié sur GTA VI.',
    honored: false,
  },
  {
    key: 'notify_contests',
    label: 'Concours et cadeaux',
    description: 'Quand un nouveau concours ouvre, ou qu\'un concours suivi se termine.',
    honored: false,
  },
]

/**
 * Onglet « Notifications ».
 *
 * HONNETETE : seul `notify_replies` est aujourd'hui consulte cote base (le
 * declencheur `tg_notify_on_comment` le verifie avant d'inserer). Les autres
 * categories n'ont encore AUCUN emetteur, et les decisions de moderation sont
 * envoyees sans consulter le reglage. Chaque interrupteur enregistre donc bien
 * votre choix, mais la note le precise plutot que de laisser croire a un
 * filtre deja actif.
 */
export function NotificationSettings() {
  const toast = useToast()
  const { settings } = useAuth()
  const update = useUpdateUserSettings()
  const [pending, setPending] = useState<NotifyKey | null>(null)

  if (!settings) {
    return (
      <SettingsSection title="Notifications" icon="bell">
        <p className={s.note}>
          Vos réglages ne sont pas encore charges. Rechargez la page : aucun interrupteur
          n'est affiche avant de connaitre sa vraie valeur.
        </p>
      </SettingsSection>
    )
  }

  function toggle(key: NotifyKey, value: boolean) {
    setPending(key)
    update.mutate(patchFor(key, value), {
      onSettled: () => setPending(null),
      onError: (error) => toast.error('Réglage non enregistre', readableError(error)),
    })
  }

  return (
    <SettingsSection
      title="Notifications"
      icon="bell"
      description="Choisissez ce qui merite de vous interrompre. Tout arrive dans l'application, jamais par e-mail."
      footnote="Aucune notification par e-mail n'est envoyée par LEONIDA : ces réglages ne concernent que la cloche de l'application."
    >
      <ul className={s.list}>
        {ITEMS.map((item) => (
          <li key={item.key} className={s.item}>
            <Switch
              checked={settings[item.key]}
              onChange={(value) => toggle(item.key, value)}
              busy={pending === item.key}
              label={item.label}
              description={item.description}
            />
            {!item.honored ? (
              <p className={s.pendingNote}>
                {item.key === 'notify_moderation'
                  ? "A savoir : les décisions sur vos découvertes sont envoyées par la base sans consulter ce réglage. Vous les recevrez donc même désactivé — votre choix est conserve pour le jour ou ce filtre sera applique."
                  : 'A savoir : aucune notification de ce type n\'est encore emise. Votre choix est enregistre et s\'appliquera des le premier envoi.'}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </SettingsSection>
  )
}
