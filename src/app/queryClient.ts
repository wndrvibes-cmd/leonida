import { QueryClient } from '@tanstack/react-query'

/**
 * Cache unique de l'application.
 *
 * Les reglages sont volontairement conservateurs : LEONIDA est consultee
 * majoritairement sur mobile, souvent en reseau degrade. On evite donc les
 * rechargements automatiques au retour sur l'onglet et on ne retente qu'une
 * seule fois, pour ne pas multiplier les requetes inutiles.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
