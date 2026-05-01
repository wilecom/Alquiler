'use server'

import { createClient } from '@/lib/supabase/server'
import { notify } from '@/lib/notifications/whatsapp'
import { redirect } from 'next/navigation'
import { addWeeks, parseISO, startOfMonth, endOfMonth } from 'date-fns'

export type AplazatoriaState = { error: string } | { success: string } | null

export async function solicitarAplazatoria(
  prevState: AplazatoriaState,
  _formData: FormData
): Promise<AplazatoriaState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: conductor } = await supabase
    .from('conductores')
    .select('id, nombre_completo, telefono')
    .eq('user_id', user.id)
    .single()

  if (!conductor) {
    return { error: 'Perfil no encontrado.' }
  }

  const { data: contrato } = await supabase
    .from('contratos')
    .select('id, semanas_pagadas, semanas_aplazatorias, primer_pago_fecha')
    .eq('conductor_id', conductor.id)
    .eq('estado', 'activo')
    .maybeSingle()

  if (!contrato) {
    return { error: 'No tienes un contrato activo.' }
  }

  // Check monthly limit: max 1 aplazatoria per calendar month
  const ahora = new Date()
  const inicioMes = startOfMonth(ahora).toISOString()
  const finMes = endOfMonth(ahora).toISOString()

  const { data: aplazatoriaExistente } = await supabase
    .from('aplazatorias_solicitudes')
    .select('id, estado')
    .eq('contrato_id', contrato.id)
    .in('estado', ['pendiente', 'aprobada'])
    .gte('created_at', inicioMes)
    .lte('created_at', finMes)
    .maybeSingle()

  if (aplazatoriaExistente) {
    return { error: 'Ya tienes una aplazatoria este mes. Solo se permite una por mes.' }
  }

  // The week to defer is the next unpaid week
  const primerPago = parseISO(contrato.primer_pago_fecha)
  const semanasProcesadas = contrato.semanas_pagadas + contrato.semanas_aplazatorias
  const semanaSolicitada = addWeeks(primerPago, semanasProcesadas)
  const semanaSolicitadaStr = semanaSolicitada.toISOString().split('T')[0]

  const { error: insertError } = await supabase.from('aplazatorias_solicitudes').insert({
    contrato_id: contrato.id,
    semana_solicitada: semanaSolicitadaStr,
    estado: 'pendiente',
  })

  if (insertError) {
    return { error: 'Error al crear la solicitud. Intenta de nuevo.' }
  }

  await notify({
    event: 'aplazatoria.pendiente',
    conductor_id: conductor.id,
    contrato_id: contrato.id,
    nombre_conductor: conductor.nombre_completo,
    telefono_conductor: conductor.telefono,
    semana: semanasProcesadas + 1,
    motivo: 'Solicitud nueva',
  })

  return { success: '¡Solicitud enviada! El equipo la revisará pronto. Recuerda: la aplazatoria cuesta $200.000.' }
}
