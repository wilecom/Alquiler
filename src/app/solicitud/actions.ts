'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { solicitudSchema } from '@/lib/validators/solicitud'
import { appendSolicitudToSheet } from '@/lib/sheets/solicitudes'
import { notify } from '@/lib/notifications/whatsapp'

function normalizarTelefono(tel: string): string {
  const digits = tel.replace(/\D/g, '')
  return digits.startsWith('57') ? digits : '57' + digits
}

export type EnviarSolicitudState =
  | { error: string }
  | { success: string }
  | null

export async function enviarSolicitud(
  _prev: EnviarSolicitudState,
  formData: FormData,
): Promise<EnviarSolicitudState> {
  const raw = Object.fromEntries(formData)
  const parsed = solicitudSchema.safeParse(raw)

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const path = issue.path.join('.')
    return {
      error: `Revisa el campo "${path || 'desconocido'}": ${issue.message}`,
    }
  }

  const d = parsed.data
  // Usamos admin client para saltarse RLS: este insert es público (form sin auth),
  // pero corre solo en el server action (service_role nunca llega al cliente).
  const supabase = await createAdminClient()

  // Cédula duplicada en solicitudes o en conductores ya creados.
  const { data: dupSol } = await supabase
    .from('solicitudes')
    .select('id, estado')
    .eq('cedula', d.cedula)
    .maybeSingle()
  if (dupSol) {
    return {
      error:
        dupSol.estado === 'rechazada'
          ? 'Ya existe una solicitud previa con esa cédula que fue rechazada. Contáctanos directamente.'
          : 'Ya enviaste una solicitud con esa cédula. Te contactaremos pronto.',
    }
  }

  const { data: dupCond } = await supabase
    .from('conductores')
    .select('id')
    .eq('cedula', d.cedula)
    .maybeSingle()
  if (dupCond) {
    return {
      error:
        'Esa cédula ya está registrada como conductor. Si olvidaste tu acceso, escríbenos por WhatsApp.',
    }
  }

  const h = await headers()
  const xff = h.get('x-forwarded-for')
  const ip = xff ? xff.split(',')[0].trim() : h.get('x-real-ip') ?? null
  const ua = h.get('user-agent') ?? null

  const { data: inserted, error: errInsert } = await supabase
    .from('solicitudes')
    .insert({
      nombre_completo: d.nombre_completo,
      cedula: d.cedula,
      edad: d.edad,
      telefono: d.telefono,
      email: d.email,

      tiene_licencia: d.tiene_licencia,
      categoria_licencia: d.tiene_licencia ? d.categoria_licencia ?? null : null,

      tiene_comparendos_pendientes: d.tiene_comparendos_pendientes,
      cantidad_comparendos: d.tiene_comparendos_pendientes ? d.cantidad_comparendos : 0,
      motivos_comparendos: d.tiene_comparendos_pendientes
        ? d.motivos_comparendos ?? null
        : null,

      acepta_habeas_data: true,
      firma_timestamp: new Date().toISOString(),
      firma_ip: ip,
      firma_user_agent: ua,
    })
    .select(
      'id, created_at, nombre_completo, cedula, edad, telefono, email, tiene_licencia, categoria_licencia, tiene_comparendos_pendientes, cantidad_comparendos, motivos_comparendos, estado, motivo_rechazo',
    )
    .single()

  if (errInsert || !inserted) {
    return { error: errInsert?.message ?? 'No se pudo registrar la solicitud.' }
  }

  // Best-effort: replicar al Sheet. Si falla, no bloquea el flow del solicitante.
  const sheetLoc = await appendSolicitudToSheet(inserted)
  if (sheetLoc !== null) {
    await supabase
      .from('solicitudes')
      .update({
        sheet_tab: sheetLoc.tab,
        sheet_row: sheetLoc.row,
        sheet_synced_at: new Date().toISOString(),
      })
      .eq('id', inserted.id)
  }

  // Best-effort: WhatsApp al solicitante (acuse) + alerta al equipo.
  const telefonoFinal = normalizarTelefono(d.telefono)
  await Promise.allSettled([
    notify({
      event: 'solicitud.recibida',
      telefono: telefonoFinal,
      nombre: d.nombre_completo.split(' ')[0],
    }),
    notify({
      event: 'equipo.solicitud_nueva',
      nombre: d.nombre_completo,
      cedula: d.cedula,
      telefono: d.telefono,
      link: `https://autoleasingmedellin.com/equipo/solicitudes/${inserted.id}`,
    }),
  ])

  return {
    success:
      'Recibimos tu solicitud. El equipo revisará tu información y te contactará por WhatsApp.',
  }
}
