/**
 * Verrou de defilement du corps de page.
 *
 * Re-export de l'implementation des calques : elle tient un COMPTEUR partage,
 * indispensable pour que la fermeture d'un dialogue ne deverrouille pas le
 * defilement alors qu'une feuille est encore ouverte derriere. Une seconde
 * implementation casserait ce comptage.
 */
export { useBodyScrollLock as useLockBodyScroll } from '@/components/ui/useOverlay'
