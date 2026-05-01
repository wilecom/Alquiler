'use server'

import { createClient } from '@/lib/supabase/server'
import { notify } from '@/lib/notifications/whatsapp'
import { revalidatePath } from 'next/cache'

export async function resolverAplazatoria(
  solicitudId: string,
  decision: 'aprobada' | 'rechazada',
  motivo?: string,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: ctx } = await supabase
    .from('aplazatorias_solicitudes')
    .select(
      'contrato_id, semana_solicitada, contratos(conductor_id, semanas_pagadas, conductores(nombre_completo, telefono))',
    )
    .eq('id', solicitudId)
    .single()

  if (!ctx) return { error: 'Solicitud no encontrada' }

  const { error } = await supabase
    .from('aplazatorias_solicitudes')
    .update({ estado: decision, revisado_por: user.id })
    .eq('id', solicitudId)
  if (error) return { error: error.message }

  const contrato = Array.isArray(ctx.contratos) ? ctx.contratos[0] : ctx.contratos
  const conductor = contrato
    ? Array.isArray(contrato.conductores)
      ? contrato.conductores[0]
      : contrato.conductores
    : null

  if (conductor && contrato) {
    await notify({
      event: 'aplazatoria.resuelta',
      conductor_id: contrato.conductor_id,
      contrato_id: ctx.contrato_id,
      nombre_conductor: conductor.nombre_completo,
      telefono_conductor: conductor.telefono,
      semana: contrato.semanas_pagadas + 1,
      decision,
      motivo,
    })
  }

  revalidatePath('/equipo/aplazatorias')
  revalidatePath('/equipo/dashboard')
  return { success: true }
}
