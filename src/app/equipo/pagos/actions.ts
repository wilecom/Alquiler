'use server'

import { createClient } from '@/lib/supabase/server'
import { notify } from '@/lib/notifications/whatsapp'
import { revalidatePath } from 'next/cache'

export async function verificarPago(
  pagoId: string,
  decision: 'verificado' | 'rechazado',
  motivo?: string,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: pagoCtx } = await supabase
    .from('pagos')
    .select(
      'contrato_id, tipo, monto, contratos(conductor_id, semanas_pagadas, semanas_aplazatorias, ahorro_acumulado, bonos_acumulados, conductores(nombre_completo, telefono))',
    )
    .eq('id', pagoId)
    .single()

  if (!pagoCtx) return { error: 'Pago no encontrado' }

  const { error } = await supabase
    .from('pagos')
    .update({ estado: decision, aprobado_por: user.id })
    .eq('id', pagoId)
  if (error) return { error: error.message }

  const contrato = Array.isArray(pagoCtx.contratos) ? pagoCtx.contratos[0] : pagoCtx.contratos
  const conductor = contrato
    ? Array.isArray(contrato.conductores)
      ? contrato.conductores[0]
      : contrato.conductores
    : null

  if (decision === 'verificado' && contrato) {
    const updates =
      pagoCtx.tipo === 'canon'
        ? {
            semanas_pagadas: contrato.semanas_pagadas + 1,
            ahorro_acumulado: contrato.ahorro_acumulado + 80000,
            bonos_acumulados: contrato.bonos_acumulados + 120000,
          }
        : {
            semanas_aplazatorias: contrato.semanas_aplazatorias + 1,
          }
    await supabase.from('contratos').update(updates).eq('id', pagoCtx.contrato_id)
  }

  if (conductor && contrato) {
    await notify({
      event: 'comprobante.resuelto',
      conductor_id: contrato.conductor_id,
      contrato_id: pagoCtx.contrato_id,
      nombre_conductor: conductor.nombre_completo,
      telefono_conductor: conductor.telefono,
      semana: contrato.semanas_pagadas + (decision === 'verificado' && pagoCtx.tipo === 'canon' ? 1 : 0),
      monto: pagoCtx.monto,
      decision,
      motivo,
    })
  }

  revalidatePath('/equipo/pagos')
  revalidatePath('/equipo/dashboard')
  return { success: true }
}
