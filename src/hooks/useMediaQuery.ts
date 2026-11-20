/**
 * Point d'entree « hooks » vers l'implementation unique des media queries.
 *
 * L'implementation vit dans `@/components/ui/useMediaQuery` parce que les
 * primitives d'interface (Modal, Sheet) en dependent directement. On la
 * re-exporte ici plutot que de la dupliquer : deux abonnements concurrents au
 * meme `matchMedia` finiraient par divergir.
 */
export { MOBILE_QUERY, useIsMobile, useMediaQuery } from '@/components/ui/useMediaQuery'
