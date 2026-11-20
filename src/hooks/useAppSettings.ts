import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { qk } from '@/lib/queryKeys'
import {
  getPublicSettings, parseAiConfig, parseAppIdentity, parseHomeHero, parseHomeSections,
  parseMapConfig, parsePremiumConfig, SETTING_KEYS,
  type AiConfig, type AppIdentity, type HomeHero, type HomeSection, type MapConfig,
  type PremiumConfig, type SettingsMap,
} from '@/services/settings'
import type { Json } from '@/types/database'

/**
 * Les reglages publics changent rarement : une seule entree de cache est
 * partagee par tous les hooks ci-dessous (meme `queryKey`, meme requete), et
 * chacun n'en extrait que sa partie via `select`.
 */
const SETTINGS_STALE = 5 * 60 * 1000

export function useAppSettings(): UseQueryResult<SettingsMap> {
  return useQuery({
    queryKey: qk.appSettings(),
    queryFn: getPublicSettings,
    staleTime: SETTINGS_STALE,
  })
}

/**
 * Valeur brute d'un reglage, avec repli.
 *
 * ATTENTION : pendant le chargement, le repli est renvoye — ce hook ne permet
 * donc pas de distinguer « pas encore charge » de « valeur par defaut ». Pour
 * un ecran qui doit afficher un squelette, utiliser `useAppSettings()` ou l'un
 * des hooks types ci-dessous, qui exposent `isLoading` et `error`.
 */
export function usePublicSetting<T>(key: string, fallback: T): T {
  const { data } = useAppSettings()
  const value: Json | undefined = data?.[key]
  if (value === undefined || value === null) return fallback
  // Conversion assumee : le contenu de `app_settings.value` est du JSON libre.
  return value as T
}

function useParsedSetting<T>(key: string, parse: (value: Json | null) => T): UseQueryResult<T> {
  return useQuery({
    queryKey: qk.appSettings(),
    queryFn: getPublicSettings,
    staleTime: SETTINGS_STALE,
    select: (map: SettingsMap) => parse(map[key] ?? null),
  })
}

export function useAppIdentity(): UseQueryResult<AppIdentity> {
  return useParsedSetting(SETTING_KEYS.identity, parseAppIdentity)
}

export function useHomeHero(): UseQueryResult<HomeHero> {
  return useParsedSetting(SETTING_KEYS.homeHero, parseHomeHero)
}

export function useHomeSections(): UseQueryResult<HomeSection[]> {
  return useParsedSetting(SETTING_KEYS.homeSections, parseHomeSections)
}

export function usePremiumConfig(): UseQueryResult<PremiumConfig> {
  return useParsedSetting(SETTING_KEYS.premiumConfig, parsePremiumConfig)
}

export function useAiConfig(): UseQueryResult<AiConfig> {
  return useParsedSetting(SETTING_KEYS.aiConfig, parseAiConfig)
}

/**
 * Configuration de la carte. Disponible aussi via `map.ts`, mais ce hook
 * profite du cache deja charge pour la page d'accueil.
 */
export function useMapConfigSetting(): UseQueryResult<MapConfig> {
  return useParsedSetting(SETTING_KEYS.mapConfig, parseMapConfig)
}
