'use server'

import { createClient } from '@/lib/supabase/server'
import { notify } from '@/lib/notifications/whatsapp'
import { redirect } from 'next/navigation'
import { addWeeks, parseISO } from 'date-fns'
import { rangoMesColombia } from '@/lib/date/colombia'

export type AplazatoriaState = { error: string } | { success: string } | null

export async function solicitarAplazatoria(
  prevState: AplazatoriaState,
  formData: FormData
): Promise<AplazatoriaState> {
  const motivo = formData.get('motivo')?.toString().trim() ?? ''
  if (motivo.length < 3 || motivo.length > 200) {
    return { error: 'Cuéntanos el motivo (entre 3 y 200 caracteres).' }
  }

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

  // Límite: máx 1 aplazatoria por mes calendario (hora Colombia).
  // El mes Colombia va de 00:00 col del día 1 (= 05:00 UTC) al 23:59:59 col último día
  // (= 04:59:59 UTC del día 1 del mes siguiente). Convertimos a UTC ISO.
  const { inicio, fin } = rangoMesColombia()
  const inicioMesUtc = `${inicio}T05:00:00.000Z`
  const [fy, fm, fd] = fin.split('-').map(Number)
  // último instante del mes Colombia = primer instante del mes siguiente Colombia menos 1ms
  const finMesSiguienteUtc = new Date(Date.UTC(fy, fm - 1, fd + 1, 5, 0, 0)).toISOString()

  const { data: aplazatoriaExistente } = await supabase
    .from('aplazatorias_solicitudes')
    .select('id, estado')
    .eq('contrato_id', contrato.id)
    .in('estado', ['pendiente', 'aprobada'])
    .gte('created_at', inicioMesUtc)
    .lt('created_at', finMesSiguienteUtc)
    .maybeSingle()

  if (aplazatoriaExistente) {
    return { error: 'Ya tienes una aplazatoria este mes. Solo se permite una por mes.' }
  }

  // The week to defer is the next unpaid week
  const primerPago = parseISO(contrato.primer_pago_fecha)
  const semanasProcesadas = contrato.semanas_pagadas + contrato.semanas_aplazatorias
  const semanaSolicitada = addWeeks(primerPago, semanasProcesadas)
  const semanaSolicitadaStr = semanaSolicitada.toISOString().slice(0, 10)

  const { error: insertError } = await supabase.from('aplazatorias_solicitudes').insert({
    contrato_id: contrato.id,
    semana_solicitada: semanaSolicitadaStr,
    estado: 'pendiente',
    motivo,
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
    motivo,
  })

  return { success: '¡Solicitud enviada! El equipo la revisará pronto. Recuerda: la aplazatoria cuesta $200.000.' }
}
