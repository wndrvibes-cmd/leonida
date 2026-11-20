import { supabase } from '@/lib/supabase'
import type { Database, Json } from '@/types/database'
import { unwrap, unwrapMaybe, unwrapVoid } from './query'

type AppSettingRow = Database['public']['Tables']['app_settings']['Row']

export type AppSetting = AppSettingRow
export type SettingsMap = Record<string, Json>

/** Membre « objet » de l'union `Json`. Le cast vers ce type est donc sur. */
type JsonObject = { [key: string]: Json | undefined }

/* ================================================== LECTURE GENERIQUE ===== */

/**
 * Tous les reglages publics, en une requete.
 *
 * `radar.config` et `moderation.config` sont marques `is_public = false` : ils
 * n'apparaissent pas ici et la RLS les reserve au staff.
 */
export async function getPublicSettings(): Promise<SettingsMap> {
  const rows = unwrap(
    await supabase.from('app_settings').select('key,value').eq('is_public', true).limit(50),
  )
  const map: SettingsMap = {}
  for (const row of rows) map[row.key] = row.value
  return map
}

/**
 * Un reglage precis. `null` si la cle n'existe pas OU si la RLS la refuse :
 * l'appelant doit toujours prevoir un repli, jamais supposer la valeur.
 */
export async function getSetting(key: string): Promise<Json | null> {
  const row = unwrapMaybe(
    await supabase.from('app_settings').select('value').eq('key', key).maybeSingle(),
  )
  return row?.value ?? null
}

/**
 * Ecriture d'un reglage.
 *
 * ATTENTION : cote base, la policy `app_settings_admin_write` reserve
 * l'ecriture aux ADMINISTRATEURS (pas aux moderateurs). Un moderateur
 * recevra un refus RLS : l'interface doit masquer le formulaire pour lui
 * plutot que de laisser croire que l'enregistrement est possible.
 *
 * `is_public` n'est pas transmis : l'upsert conserve la valeur existante et
 * une cle nouvelle reste privee par defaut.
 */
export async function updateSetting(key: string, value: Json): Promise<void> {
  unwrapVoid(await supabase.from('app_settings').upsert({ key, value }, { onConflict: 'key' }))
}

/* ============================================== LECTURES TYPEES =========== */

function asObject(value: Json | null | undefined): JsonObject | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as JsonObject
}

function readString(value: Json | undefined, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

function readNullableString(value: Json | undefined, fallback: string | null): string | null {
  if (typeof value === 'string') return value.length > 0 ? value : null
  if (value === null) return null
  return fallback
}

function readNumber(value: Json | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function readNullableNumber(value: Json | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readBoolean(value: Json | undefined, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function readStringList(value: Json | undefined): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

/* ---------------------------------------------------------- app.identity -- */

export interface AppIdentity {
  name: string
  tagline: string | null
  logoUrl: string | null
}

export function parseAppIdentity(value: Json | null | undefined): AppIdentity {
  const raw = asObject(value)
  return {
    name: readString(raw?.name, 'LEONIDA'),
    tagline: readNullableString(raw?.tagline, 'La communaute GTA VI'),
    logoUrl: readNullableString(raw?.logo_url, null),
  }
}

/* ------------------------------------------------------------- home.hero -- */

export interface HomeHero {
  enabled: boolean
  title: string
  subtitle: string | null
  imageUrl: string | null
  ctaLabel: string | null
  ctaLink: string | null
  align: 'left' | 'center'
  startsAt: string | null
  endsAt: string | null
}

export function parseHomeHero(value: Json | null | undefined): HomeHero {
  const raw = asObject(value)
  const align = readString(raw?.align, 'left')
  return {
    enabled: readBoolean(raw?.enabled, true),
    title: readString(raw?.title, 'Bienvenue dans Leonida'),
    subtitle: readNullableString(raw?.subtitle, null),
    imageUrl: readNullableString(raw?.image_url, null),
    ctaLabel: readNullableString(raw?.cta_label, null),
    ctaLink: readNullableString(raw?.cta_link, null),
    align: align === 'center' ? 'center' : 'left',
    startsAt: readNullableString(raw?.starts_at, null),
    endsAt: readNullableString(raw?.ends_at, null),
  }
}

/**
 * `true` si la banniere doit s'afficher maintenant : activee et dans sa
 * fenetre de programmation.
 */
export function isHeroVisible(hero: HomeHero, now = new Date()): boolean {
  if (!hero.enabled) return false
  if (hero.startsAt && new Date(hero.startsAt) > now) return false
  if (hero.endsAt && new Date(hero.endsAt) < now) return false
  return true
}

/* --------------------------------------------------------- home.sections -- */

export interface HomeSection {
  key: string
  label: string
  enabled: boolean
  order: number
}

/** Sections activees, triees. Tableau vide si le reglage est illisible. */
export function parseHomeSections(value: Json | null | undefined): HomeSection[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => asObject(item))
    .filter((raw): raw is JsonObject => raw !== null)
    .map((raw) => ({
      key: readString(raw.key, ''),
      label: readString(raw.label, ''),
      enabled: readBoolean(raw.enabled, false),
      order: readNumber(raw.order, 999),
    }))
    .filter((section) => section.key.length > 0)
    .sort((a, b) => a.order - b.order)
}

/* ------------------------------------------------------------ map.config -- */

export interface MapConfig {
  /**
   * `null` tant qu'aucune image n'a ete televersee par un administrateur :
   * la carte doit alors afficher un etat vide explicite, pas un fond casse.
   */
  imageUrl: string | null
  naturalWidth: number | null
  naturalHeight: number | null
  minZoom: number
  maxZoom: number
  /** Mention d'origine a afficher : le visuel n'est pas officiel. */
  disclaimer: string | null
}

export function parseMapConfig(value: Json | null | undefined): MapConfig {
  const raw = asObject(value)
  const minZoom = readNumber(raw?.min_zoom, 1)
  const maxZoom = readNumber(raw?.max_zoom, 8)
  return {
    imageUrl: readNullableString(raw?.image_url, null),
    naturalWidth: readNullableNumber(raw?.natural_width),
    naturalHeight: readNullableNumber(raw?.natural_height),
    minZoom,
    // Garde-fou : une configuration incoherente ne doit pas bloquer le zoom.
    maxZoom: maxZoom > minZoom ? maxZoom : minZoom + 1,
    disclaimer: readNullableString(raw?.disclaimer, null),
  }
}

/* -------------------------------------------------------- premium.config -- */

export interface PremiumConfig {
  priceEur: number | null
  currency: string
  interval: string
  stripeMode: string
  /**
   * `false` tant qu'aucun paiement reel n'est branche. L'interface doit alors
   * desactiver le bouton d'abonnement avec une explication, jamais simuler
   * un parcours de paiement.
   */
  stripeEnabled: boolean
  benefits: string[]
}

export function parsePremiumConfig(value: Json | null | undefined): PremiumConfig {
  const raw = asObject(value)
  return {
    priceEur: readNullableNumber(raw?.price_eur),
    currency: readString(raw?.currency, 'EUR'),
    interval: readString(raw?.interval, 'month'),
    stripeMode: readString(raw?.stripe_mode, 'test'),
    stripeEnabled: readBoolean(raw?.stripe_enabled, false),
    benefits: readStringList(raw?.benefits),
  }
}

/* ------------------------------------------------------------- ai.config -- */

export interface AiConfig {
  enabled: boolean
  provider: string | null
  dailyMessagesFree: number
  dailyMessagesPremium: number
  note: string | null
}

export function parseAiConfig(value: Json | null | undefined): AiConfig {
  const raw = asObject(value)
  return {
    enabled: readBoolean(raw?.enabled, false),
    provider: readNullableString(raw?.provider, null),
    dailyMessagesFree: readNumber(raw?.daily_messages_free, 10),
    dailyMessagesPremium: readNumber(raw?.daily_messages_premium, 60),
    note: readNullableString(raw?.note, null),
  }
}

/* ------------------------------------------------------ moderation.config - */

export interface ModerationConfig {
  requireApprovalForMarkers: boolean
  autoHideReportedThreshold: number
}

export function parseModerationConfig(value: Json | null | undefined): ModerationConfig {
  const raw = asObject(value)
  return {
    // Repli prudent : on suppose la validation obligatoire.
    requireApprovalForMarkers: readBoolean(raw?.require_approval_for_markers, true),
    autoHideReportedThreshold: readNumber(raw?.auto_hide_reported_threshold, 5),
  }
}

/* ----------------------------------------------------------- radar.config - */

export interface RadarConfig {
  enabled: boolean
  intervalHours: number
  provider: string | null
  autoPublish: boolean
  maxItemsPerRun: number
  note: string | null
}

export function parseRadarConfig(value: Json | null | undefined): RadarConfig {
  const raw = asObject(value)
  return {
    enabled: readBoolean(raw?.enabled, false),
    intervalHours: readNumber(raw?.interval_hours, 10),
    provider: readNullableString(raw?.provider, null),
    autoPublish: readBoolean(raw?.auto_publish, false),
    maxItemsPerRun: readNumber(raw?.max_items_per_run, 12),
    note: readNullableString(raw?.note, null),
  }
}

/** Cles connues de `app_settings`, pour eviter les fautes de frappe. */
export const SETTING_KEYS = {
  identity: 'app.identity',
  homeHero: 'home.hero',
  homeSections: 'home.sections',
  mapConfig: 'map.config',
  radarConfig: 'radar.config',
  premiumConfig: 'premium.config',
  aiConfig: 'ai.config',
  moderationConfig: 'moderation.config',
} as const
