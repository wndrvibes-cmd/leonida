import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { safeLimit, unwrap, unwrapCount } from './query'

type ReportRow = Database['public']['Tables']['reports']['Row']
type TargetType = Database['public']['Enums']['target_type']
type ReportReason = Database['public']['Enums']['report_reason']

export type Report = ReportRow

export interface CreateReportInput {
  /** Doit etre l'identifiant du membre connecte : la RLS le verifie. */
  reporterId: string
  targetType: TargetType
  targetId: string
  reason: ReportReason
  details?: string | null
}

/**
 * Depose un signalement. Le statut et la note interne sont laisses a la base
 * et au staff : un membre ne choisit ni l'un ni l'autre.
 */
export async function createReport(input: CreateReportInput): Promise<ReportRow> {
  return unwrap(
    await supabase
      .from('reports')
      .insert({
        reporter_id: input.reporterId,
        target_type: input.targetType,
        target_id: input.targetId,
        reason: input.reason,
        details: input.details?.trim() || null,
      })
      .select('*')
      .single(),
  )
}

/**
 * Signalements deposes par un membre. `internal_note` est lisible par la
 * policy mais ne doit PAS etre affiche a l'auteur du signalement : c'est une
 * note de moderation.
 */
export async function listMyReports(reporterId: string, limit = 30): Promise<ReportRow[]> {
  return unwrap(
    await supabase
      .from('reports')
      .select('*')
      .eq('reporter_id', reporterId)
      .order('created_at', { ascending: false })
      .limit(safeLimit(limit)),
  )
}

/** `true` si ce membre a deja signale ce contenu : evite les doublons. */
export async function hasReported(
  reporterId: string,
  targetType: TargetType,
  targetId: string,
): Promise<boolean> {
  const count = unwrapCount(
    await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('reporter_id', reporterId)
      .eq('target_type', targetType)
      .eq('target_id', targetId),
  )
  return count > 0
}
