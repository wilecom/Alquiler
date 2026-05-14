'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  readSolicitudesFromSheet,
  estadoEsValido,
  ensureHeaders,
} from '@/lib/sheets/solicitudes'

export type SyncResult =
  | { error: string }
  | {
      success: true
      actualizadas: number
      revisadas: number
      huérfanas: number
    }
  | null

/**
 * Pull-from-Sheet: lee las filas del Sheet y aplica diffs a la BD.
 *
 * Campos editables desde Sheet (por ahora):
 *   - estado (uno de: formulario, visita_local, visita_domiciliaria, aprobada, rechazada)
 *   - motivo_rechazo
 *
 * Aprobada NO se considera editable desde Sheet (porque eso requiere crear conductor +
 * auth user, lo cual debe hacerse desde el panel). Si el Sheet trae 'aprobada' pero
 * la BD tiene otro estado, la fila se reporta pero no se aplica.
 */
export async function sincronizarDesdeSheet(
  _prev: SyncResult,
  _formData: FormData,
): Promise<SyncResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  try {
    await ensureHeaders()
  } catch (err) {
    return { error: 'No se pudo abrir el Sheet: ' + (err instanceof Error ? err.message : String(err)) }
  }

  const snapshots = await readSolicitudesFromSheet()

  const { data: solicitudes, error: errFetch } = await supabase
    .from('solicitudes')
    .select('id, estado, motivo_rechazo')

  if (errFetch) return { error: errFetch.message }
  const byId = new Map(solicitudes?.map((s) => [s.id, s]) ?? [])

  let actualizadas = 0
  let huérfanas = 0

  for (const snap of snapshots) {
    const db = byId.get(snap.id)
    if (!db) {
      huérfanas++
      continue
    }

    // No aplicamos transición a aprobada desde Sheet (requiere flow del panel).
    if (snap.estado === 'aprobada' && db.estado !== 'aprobada') continue
    // Una solicitud aprobada no se puede mover desde el Sheet tampoco.
    if (db.estado === 'aprobada') continue

    type EstadoEnum =
      | 'formulario'
      | 'visita_local'
      | 'visita_domiciliaria'
      | 'aprobada'
      | 'rechazada'
    const cambios: { estado?: EstadoEnum; motivo_rechazo?: string | null } = {}

    if (snap.estado && snap.estado !== db.estado && estadoEsValido(snap.estado)) {
      cambios.estado = snap.estado
    }
    const motivoNormalizado = snap.motivo_rechazo ?? null
    if (motivoNormalizado !== (db.motivo_rechazo ?? null)) {
      cambios.motivo_rechazo = motivoNormalizado
    }

    if (Object.keys(cambios).length === 0) continue

    const { error: errUpd } = await supabase
      .from('solicitudes')
      .update({
        ...cambios,
        revisado_por: user.id,
        sheet_synced_at: new Date().toISOString(),
      })
      .eq('id', snap.id)

    if (!errUpd) actualizadas++
  }

  revalidatePath('/equipo/solicitudes')

  return {
    success: true,
    actualizadas,
    revisadas: snapshots.length,
    huérfanas,
  }
}
