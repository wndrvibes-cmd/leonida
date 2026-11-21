import { useState } from 'react'
import { Icon, Modal } from '@/components/ui'
import { publicUrl } from '@/lib/supabase'
import type { NewsMedia } from '@/services/news'
import s from './ArticleGallery.module.css'

export interface ArticleGalleryProps {
  media: NewsMedia[]
}

/** Nom d'hote lisible, pour annoncer ou mene un lien sortant. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'un site externe'
  }
}

function Caption({ item }: { item: NewsMedia }) {
  if (!item.caption && !item.credit) return null
  return (
    <figcaption className={s.caption}>
      {item.caption ? <span>{item.caption}</span> : null}
      {item.credit ? <span className={s.credit}>Credit : {item.credit}</span> : null}
    </figcaption>
  )
}

/**
 * Galerie d'un article (`news_media`).
 *
 * Les trois genres de media de la base sont traites separement :
 *   - `image` : vignette agrandissable dans un dialogue ;
 *   - `video` : fichier video lu sur place, sans lecture automatique ;
 *   - `video_link` : lien SORTANT assume. On n'intégré pas d'iframe d'un
 *     domaine arbitraire : on annonce ou le lien mene et on laisse le membre
 *     decider.
 */
export function ArticleGallery({ media }: ArticleGalleryProps) {
  const [zoomed, setZoomed] = useState<NewsMedia | null>(null)

  if (media.length === 0) return null

  const zoomedUrl = zoomed ? publicUrl('news', zoomed.url) : null

  return (
    <section className={s.wrap} aria-labelledby="article-medias">
      <h2 className={s.title} id="article-medias">
        <Icon name="image" size={20} />
        Médias
      </h2>

      <ul className={s.grid}>
        {media.map((item) => {
          if (item.kind === 'video_link') {
            return (
              <li key={item.id}>
                <figure className={s.figure}>
                  <a
                    className={s.external}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className={s.externalIcon} aria-hidden="true">
                      <Icon name="play" size={22} />
                    </span>
                    <span className={s.externalText}>
                      <strong>Ouvrir la vidéo</strong>
                      <span className={s.host}>{hostOf(item.url)}</span>
                    </span>
                    <Icon name="external" size={16} />
                  </a>
                  <Caption item={item} />
                </figure>
              </li>
            )
          }

          const url = publicUrl('news', item.url)
          if (!url) return null

          if (item.kind === 'video') {
            return (
              <li key={item.id}>
                <figure className={s.figure}>
                  <video className={s.video} src={url} controls preload="metadata" />
                  <Caption item={item} />
                </figure>
              </li>
            )
          }

          return (
            <li key={item.id}>
              <figure className={s.figure}>
                <button
                  type="button"
                  className={s.shot}
                  onClick={() => setZoomed(item)}
                  aria-label={
                    item.caption ? `Agrandir : ${item.caption}` : "Agrandir l'image"
                  }
                >
                  <img src={url} alt={item.caption ?? ''} loading="lazy" decoding="async" />
                  <span className={s.zoom} aria-hidden="true">
                    <Icon name="zoom-in" size={16} />
                  </span>
                </button>
                <Caption item={item} />
              </figure>
            </li>
          )
        })}
      </ul>

      <Modal
        open={Boolean(zoomed && zoomedUrl)}
        onClose={() => setZoomed(null)}
        size="lg"
        ariaLabel={zoomed?.caption ?? 'Image agrandie'}
      >
        {zoomed && zoomedUrl ? (
          <figure className={s.zoomed}>
            <img src={zoomedUrl} alt={zoomed.caption ?? ''} />
            <Caption item={zoomed} />
          </figure>
        ) : null}
      </Modal>
    </section>
  )
}
