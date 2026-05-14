'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { solicitudSchema } from '@/lib/validators/solicitud'

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
  const supabase = await createClient()

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

  const { error: errInsert } = await supabase.from('solicitudes').insert({
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

  if (errInsert) {
    return { error: errInsert.message }
  }

  return {
    success:
      'Recibimos tu solicitud. El equipo revisará tu información y te contactará por WhatsApp.',
  }
}
