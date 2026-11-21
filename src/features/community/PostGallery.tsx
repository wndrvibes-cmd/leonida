import { useState } from 'react'
import { Button, Icon, Modal, cx } from '@/components/ui'
import { publicUrl } from '@/lib/supabase'
import type { PostMedia } from '@/services/posts'
import { hostOf, parseVideoLink } from './videoLink'
import s from './PostGallery.module.css'

export interface PostGalleryProps {
  media: PostMedia[]
  /** `compact` : apercu dans le fil. `full` : page de detail. */
  variant?: 'compact' | 'full'
}

/** Vignettes affichees dans le fil ; au-dela, une pastille « +n » honnete. */
const COMPACT_MAX = 4

/**
 * Medias d'une publication (`post_media`).
 *
 * Les trois genres de la base sont traites separement :
 *   - `image` : vignette agrandissable dans un dialogue ;
 *   - `video` : fichier lu sur place, sans lecture automatique ;
 *   - `video_link` : lien SORTANT assume. Aucune iframe d'un domaine tiers
 *     n'est integree : on annonce ou mene le lien, le membre decide. La
 *     miniature n'est affichee que lorsque le fournisseur en expose une
 *     reellement (YouTube) ; pour Twitch, une carte de lecture sobre remplace
 *     l'image plutôt qu'une vignette inventee.
 */
export function PostGallery({ media, variant = 'full' }: PostGalleryProps) {
  const [zoom, setZoom] = useState<number | null>(null)

  if (media.length === 0) return null

  const pictures = media.filter((item) => item.kind === 'image')
  const videos = media.filter((item) => item.kind === 'video')
  const links = media.filter((item) => item.kind === 'video_link')

  const compact = variant === 'compact'
  const shown = compact ? pictures.slice(0, COMPACT_MAX) : pictures
  const hidden = pictures.length - shown.length

  const zoomed = zoom !== null ? pictures[zoom] ?? null : null
  const zoomedUrl = zoomed ? publicUrl('posts', zoomed.url) : null

  const go = (step: number) => {
    if (zoom === null || pictures.length === 0) return
    setZoom((zoom + step + pictures.length) % pictures.length)
  }

  return (
    <div className={cx(s.wrap, compact && s.compact)}>
      {shown.length > 0 ? (
        <ul className={cx(s.grid, s[`count${Math.min(shown.length, 4)}`])}>
          {shown.map((item, index) => {
            const url = publicUrl('posts', item.url)
            if (!url) return null
            const last = index === shown.length - 1 && hidden > 0

            return (
              <li key={item.id} className={s.cell}>
                <button
                  type="button"
                  className={s.shot}
                  onClick={() => setZoom(index)}
                  aria-label={
                    item.caption ? `Agrandir : ${item.caption}` : `Agrandir l'image ${index + 1}`
                  }
                >
                  <img src={url} alt="" loading="lazy" decoding="async" />
                  {last ? (
                    <span className={s.more} aria-hidden="true">
                      +{hidden}
                    </span>
                  ) : (
                    <span className={s.zoom} aria-hidden="true">
                      <Icon name="zoom-in" size={16} />
                    </span>
                  )}
                </button>
                {item.caption && !compact ? (
                  <p className={s.caption}>{item.caption}</p>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : null}

      {videos.map((item) => {
        const url = publicUrl('posts', item.url)
        if (!url) return null
        return (
          <figure key={item.id} className={s.figure}>
            <video className={s.video} src={url} controls preload="metadata" />
            {item.caption ? <figcaption className={s.caption}>{item.caption}</figcaption> : null}
          </figure>
        )
      })}

      {links.map((item) => {
        const link = parseVideoLink(item.url)
        return (
          <a
            key={item.id}
            className={s.external}
            href={link?.canonicalUrl ?? item.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {link?.thumbnailUrl ? (
              <img className={s.thumb} src={link.thumbnailUrl} alt="" loading="lazy" />
            ) : (
              <span className={s.thumbFallback} aria-hidden="true">
                <Icon name="play" size={24} />
              </span>
            )}
            <span className={s.externalText}>
              <strong className={s.externalTitle}>
                {link ? `Ouvrir la ${link.label.toLowerCase()}` : 'Ouvrir le lien vidéo'}
              </strong>
              <span className={s.host}>
                {hostOf(link?.canonicalUrl ?? item.url)} — lien externe
              </span>
            </span>
            <Icon name="external" size={16} className={s.externalIcon} />
          </a>
        )
      })}

      <Modal
        open={Boolean(zoomed && zoomedUrl)}
        onClose={() => setZoom(null)}
        size="lg"
        ariaLabel={zoomed?.caption ?? 'Image agrandie'}
      >
        {zoomed && zoomedUrl ? (
          <figure className={s.zoomed}>
            <img src={zoomedUrl} alt={zoomed.caption ?? ''} />
            {zoomed.caption ? <figcaption className={s.caption}>{zoomed.caption}</figcaption> : null}

            {pictures.length > 1 ? (
              <div className={s.zoomNav}>
                <Button
                  variant="secondary"
                  size="md"
                  iconOnly
                  aria-label="Image precedente"
                  onClick={() => go(-1)}
                >
                  <Icon name="chevron-left" size={18} />
                </Button>
                <span className={s.zoomCount} role="status">
                  {(zoom ?? 0) + 1} / {pictures.length}
                </span>
                <Button
                  variant="secondary"
                  size="md"
                  iconOnly
                  aria-label="Image suivante"
                  onClick={() => go(1)}
                >
                  <Icon name="chevron-right" size={18} />
                </Button>
              </div>
            ) : null}
          </figure>
        ) : null}
      </Modal>
    </div>
  )
}
