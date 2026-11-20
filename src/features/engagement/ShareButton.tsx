import { useState } from 'react'
import { Button, Icon, cx, useToast } from '@/components/ui'
import type { EngagementSize } from './types'
import s from './ShareButton.module.css'

/**
 * `navigator.share` n'est pas decrit par toutes les versions de lib.dom ; on
 * le declare localement plutot que de desactiver le typage.
 */
interface SharePayload {
  title?: string
  text?: string
  url?: string
}
type ShareCapableNavigator = Navigator & { share?: (data: SharePayload) => Promise<void> }

export interface ShareButtonProps {
  /** Chemin interne (« /communaute/42 ») ou URL absolue. */
  url: string
  title?: string
  text?: string
  withLabel?: boolean
  size?: EngagementSize
  className?: string
}

function toAbsolute(url: string): string {
  if (typeof window === 'undefined') return url
  try {
    return new URL(url, window.location.origin).toString()
  } catch {
    return url
  }
}

/** Annulation volontaire du panneau de partage : ce n'est pas une erreur. */
function isAbort(error: unknown): boolean {
  return (error as { name?: string } | null)?.name === 'AbortError'
}

export function ShareButton({
  url,
  title,
  text,
  withLabel = false,
  size = 'md',
  className,
}: ShareButtonProps) {
  const toast = useToast()
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const absolute = toAbsolute(url)

    // 1. Panneau natif (iPhone, Android) : le meilleur chemin quand il existe.
    const nav = navigator as ShareCapableNavigator
    if (typeof nav.share === 'function') {
      try {
        await nav.share({ title, text, url: absolute })
        return
      } catch (shareError) {
        if (isAbort(shareError)) return
        // Sinon on retombe sur le presse-papier ci-dessous.
      }
    }

    // 2. Presse-papier.
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(absolute)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
        toast.success('Lien copie', absolute)
        return
      } catch {
        // Permission refusee ou contexte non securise : dernier recours.
      }
    }

    // 3. Dernier recours : on affiche le lien pour une copie manuelle. Le
    // bouton n'est jamais sans effet, et on ne pretend pas avoir copie.
    toast.toast({
      title: 'Copie automatique indisponible',
      description: absolute,
      variant: 'info',
      duration: 0,
    })
  }

  const label = 'Partager'

  return (
    <Button
      variant="ghost"
      size={size === 'sm' ? 'sm' : 'md'}
      iconOnly={!withLabel}
      onClick={() => void handleShare()}
      aria-label={withLabel ? undefined : label}
      title={label}
      className={cx(copied && s.copied, className)}
      iconLeft={withLabel ? <Icon name={copied ? 'check' : 'share'} size={18} /> : undefined}
    >
      {withLabel ? (copied ? 'Lien copie' : label) : <Icon name={copied ? 'check' : 'share'} size={18} />}
    </Button>
  )
}
