'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'node:crypto'
import {
  appendSolicitudToSheet,
  updateSolicitudInSheet,
  type SolicitudSheetRow,
} from '@/lib/sheets/solicitudes'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const PIPELINE_ORDEN = ['formulario', 'visita_local', 'visita_domiciliaria'] as const
type EstadoPipeline = typeof PIPELINE_ORDEN[number]

function generarPassword(): string {
  // 9 chars base64url, fácil de leer y compartir por WhatsApp.
  return randomBytes(7).toString('base64url')
}

type SheetSnapshot = SolicitudSheetRow & { sheet_row: number | null }

/**
 * Lee del Sheet la fila correspondiente y la actualiza. Si nunca tuvo sheet_row
 * (porque el append inicial falló), hace append y persiste el nuevo row.
 * Best-effort: errores del Sheet NO bloquean el flujo.
 */
async function reflectInSheet(
  supabase: SupabaseClient<Database>,
  solicitudId: string,
  snapshot: SheetSnapshot,
) {
  try {
    if (snapshot.sheet_row) {
      const ok = await updateSolicitudInSheet(snapshot.sheet_row, snapshot)
      if (ok) {
        await supabase
          .from('solicitudes')
          .update({ sheet_synced_at: new Date().toISOString() })
          .eq('id', solicitudId)
      }
      return
    }
    // No tenía sheet_row → intentar append ahora.
    const newRow = await appendSolicitudToSheet(snapshot)
    if (newRow !== null) {
      await supabase
        .from('solicitudes')
        .update({ sheet_row: newRow, sheet_synced_at: new Date().toISOString() })
        .eq('id', solicitudId)
    }
  } catch (err) {
    console.warn('[sheets] reflectInSheet failed:', err)
  }
}

const SHEET_SELECT =
  'id, sheet_row, created_at, nombre_completo, cedula, edad, telefono, email, tiene_licencia, categoria_licencia, tiene_comparendos_pendientes, cantidad_comparendos, motivos_comparendos, estado, motivo_rechazo'

export async function avanzarPipeline(solicitudId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: solicitud } = await supabase
    .from('solicitudes')
    .select('estado')
    .eq('id', solicitudId)
    .single()
  if (!solicitud) return { error: 'Solicitud no encontrada' }

  const idx = PIPELINE_ORDEN.indexOf(solicitud.estado as EstadoPipeline)
  if (idx === -1 || idx === PIPELINE_ORDEN.length - 1) {
    return { error: 'No hay siguiente etapa.' }
  }

  const nuevoEstado = PIPELINE_ORDEN[idx + 1]
  const { data: updated, error } = await supabase
    .from('solicitudes')
    .update({ estado: nuevoEstado, revisado_por: user.id })
    .eq('id', solicitudId)
    .select(SHEET_SELECT)
    .single()

  if (error) return { error: error.message }
  if (updated) await reflectInSheet(supabase, solicitudId, updated as SheetSnapshot)

  revalidatePath('/equipo/solicitudes')
  revalidatePath(`/equipo/solicitudes/${solicitudId}`)
  return { success: true }
}

export async function rechazarSolicitud(solicitudId: string, formData: FormData) {
  const motivo = formData.get('motivo')?.toString().trim()
  if (!motivo || motivo.length < 3) return { error: 'Escribe el motivo del rechazo.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: updated, error } = await supabase
    .from('solicitudes')
    .update({
      estado: 'rechazada',
      motivo_rechazo: motivo,
      revisado_por: user.id,
    })
    .eq('id', solicitudId)
    .select(SHEET_SELECT)
    .single()
  if (error) return { error: error.message }
  if (updated) await reflectInSheet(supabase, solicitudId, updated as SheetSnapshot)

  revalidatePath('/equipo/solicitudes')
  revalidatePath(`/equipo/solicitudes/${solicitudId}`)
  return { success: true }
}

export type AprobarState = { error: string } | { success: string; password?: string } | null

export async function aprobarSolicitud(
  solicitudId: string,
  _prev: AprobarState,
  _formData: FormData,
): Promise<AprobarState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // Cargar la solicitud completa.
  const { data: solicitud, error: errSol } = await supabase
    .from('solicitudes')
    .select(
      'id, estado, nombre_completo, cedula, edad, telefono, email, barrio, direccion, tiene_licencia, tiene_comparendos_pendientes, conductor_id',
    )
    .eq('id', solicitudId)
    .single<{
      id: string
      estado: string
      nombre_completo: string
      cedula: string
      edad: number
      telefono: string
      email: string
      barrio: string | null
      direccion: string | null
      tiene_licencia: boolean
      tiene_comparendos_pendientes: boolean
      conductor_id: string | null
    }>()

  if (errSol || !solicitud) return { error: 'Solicitud no encontrada.' }
  if (solicitud.estado === 'aprobada') {
    return { error: 'Esta solicitud ya fue aprobada.' }
  }
  if (solicitud.estado === 'rechazada') {
    return { error: 'No se puede aprobar una solicitud rechazada.' }
  }
  if (solicitud.estado !== 'visita_domiciliaria') {
    return {
      error:
        'La solicitud debe estar en "Visita domiciliaria" antes de aprobarse. Avanza el pipeline primero.',
    }
  }

  const admin = await createAdminClient()
  const password = generarPassword()

  const { data: created, error: errAuth } = await admin.auth.admin.createUser({
    email: solicitud.email,
    password,
    email_confirm: true,
    user_metadata: {
      rol: 'conductor',
      nombre_completo: solicitud.nombre_completo,
    },
  })

  if (errAuth || !created?.user) {
    return { error: 'No se pudo crear el usuario: ' + (errAuth?.message ?? 'desconocido') }
  }

  const { data: conductor, error: errCond } = await supabase
    .from('conductores')
    .insert({
      user_id: created.user.id,
      nombre_completo: solicitud.nombre_completo,
      cedula: solicitud.cedula,
      edad: solicitud.edad,
      // barrio y direccion en `conductores` son NOT NULL; en solicitudes ya no se
      // piden en la captura inicial. El equipo completa estos datos en
      // /equipo/conductores/[id].
      barrio: solicitud.barrio ?? 'Pendiente',
      direccion: solicitud.direccion ?? 'Pendiente',
      telefono: solicitud.telefono,
      email: solicitud.email,
      estado_solicitud: 'aprobado',
      tiene_licencia: solicitud.tiene_licencia,
      tiene_multas: solicitud.tiene_comparendos_pendientes,
    })
    .select('id')
    .single()

  if (errCond || !conductor) {
    // Rollback del auth user para evitar huérfanos.
    await admin.auth.admin.deleteUser(created.user.id)
    return { error: 'No se pudo crear el conductor: ' + (errCond?.message ?? 'desconocido') }
  }

  const { data: updated, error: errUpd } = await supabase
    .from('solicitudes')
    .update({
      estado: 'aprobada',
      conductor_id: conductor.id,
      revisado_por: user.id,
    })
    .eq('id', solicitudId)
    .select(SHEET_SELECT)
    .single()

  if (errUpd) {
    // No tirar abajo el conductor — mejor dejar la inconsistencia visible y corregir manualmente.
    return {
      error:
        'Conductor creado pero la solicitud no se pudo marcar como aprobada: ' +
        errUpd.message,
    }
  }

  if (updated) await reflectInSheet(supabase, solicitudId, updated as SheetSnapshot)

  revalidatePath('/equipo/solicitudes')
  revalidatePath(`/equipo/solicitudes/${solicitudId}`)
  revalidatePath('/equipo/conductores')
  revalidatePath('/equipo/dashboard')

  return {
    success: `Conductor creado. Compártele esta contraseña por WhatsApp (única vez): ${password}`,
    password,
  }
}
