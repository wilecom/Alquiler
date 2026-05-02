'use server'

import { createClient } from '@/lib/supabase/server'
import { notify } from '@/lib/notifications/whatsapp'
import { redirect } from 'next/navigation'
import { addWeeks, parseISO } from 'date-fns'

export type PagoState = { error: string } | { success: string }

export async function subirComprobante(args: { path: string }): Promise<PagoState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: conductor } = await supabase
    .from('conductores')
    .select('id, nombre_completo, telefono')
    .eq('user_id', user.id)
    .single()
  if (!conductor) return { error: 'Perfil no encontrado.' }

  const { data: contrato } = await supabase
    .from('contratos')
    .select('id, semanas_pagadas, semanas_aplazatorias, primer_pago_fecha')
    .eq('conductor_id', conductor.id)
    .eq('estado', 'activo')
    .maybeSingle()
  if (!contrato) return { error: 'No tienes un contrato activo.' }

  // Validate that the uploaded path is inside this contract's folder
  if (!args.path || !args.path.startsWith(`${contrato.id}/`)) {
    return { error: 'Ruta de archivo inválida.' }
  }

  const primerPago = parseISO(contrato.primer_pago_fecha)
  const semanasProcesadas = contrato.semanas_pagadas + contrato.semanas_aplazatorias
  const fechaVencimiento = addWeeks(primerPago, semanasProcesadas)
  const fechaVencimientoStr = fechaVencimiento.toISOString().split('T')[0]

  const { data: pagoExistente } = await supabase
    .from('pagos')
    .select('id, estado')
    .eq('contrato_id', contrato.id)
    .eq('fecha_vencimiento', fechaVencimientoStr)
    .in('estado', ['pendiente', 'comprobante_subido'])
    .maybeSingle()

  if (pagoExistente) {
    // Best-effort delete the orphan upload to avoid clutter
    await supabase.storage.from('comprobantes').remove([args.path])
    return { error: 'Ya subiste un comprobante para esta semana y está en revisión.' }
  }

  const hoy = new Date().toISOString().split('T')[0]

  const { error: pagoError } = await supabase.from('pagos').insert({
    contrato_id: contrato.id,
    tipo: 'canon',
    fecha_pago: hoy,
    fecha_vencimiento: fechaVencimientoStr,
    monto: 480000,
    comprobante_url: args.path,
    estado: 'comprobante_subido',
  })
  if (pagoError) {
    return { error: 'Error al registrar el pago. Contacta al equipo.' }
  }

  const { data: signed } = await supabase.storage
    .from('comprobantes')
    .createSignedUrl(args.path, 60 * 60 * 24 * 7)

  // Fire-and-forget — no await so we don't block the response on a slow N8N
  notify({
    event: 'comprobante.subido',
    conductor_id: conductor.id,
    contrato_id: contrato.id,
    nombre_conductor: conductor.nombre_completo,
    telefono_conductor: conductor.telefono,
    semana: semanasProcesadas + 1,
    monto: 480000,
    comprobante_url: signed?.signedUrl ?? args.path,
    fecha_pago: hoy,
  }).catch(() => {})

  return { success: '¡Comprobante enviado! El equipo lo revisará pronto.' }
}
