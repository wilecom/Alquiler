'use server'

import { createClient } from '@/lib/supabase/server'
import { notify } from '@/lib/notifications/whatsapp'
import { archivarPago } from '@/lib/archive'
import { revalidatePath } from 'next/cache'

export async function verificarPago(
  pagoId: string,
  decision: 'verificado' | 'rechazado',
  formData: FormData,
) {
  const motivo =
    decision === 'rechazado'
      ? formData.get('motivo')?.toString().trim() || undefined
      : undefined

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: pagoCtx } = await supabase
    .from('pagos')
    .select(
      'estado, contrato_id, tipo, monto, dias_mora, multa_mora, fecha_pago, comprobante_url, contratos(conductor_id, semanas_pagadas, semanas_aplazatorias, ahorro_acumulado, bonos_acumulados, abonos_extras_acumulados, conductores(nombre_completo, telefono, cedula), vehiculos(placa))',
    )
    .eq('id', pagoId)
    .single()

  if (!pagoCtx) return { error: 'Pago no encontrado' }
  if (pagoCtx.estado !== 'comprobante_subido') {
    // Idempotencia: si el pago ya fue resuelto (re-submit del form, doble clic, retry),
    // no volver a incrementar contadores ni reenviar WhatsApp.
    return { success: true }
  }

  const { error } = await supabase
    .from('pagos')
    .update({ estado: decision, aprobado_por: user.id })
    .eq('id', pagoId)
    .eq('estado', 'comprobante_subido')
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
        : pagoCtx.tipo === 'abono_extra'
          ? {
              abonos_extras_acumulados:
                (contrato.abonos_extras_acumulados ?? 0) + pagoCtx.monto,
            }
          : {
              semanas_aplazatorias: contrato.semanas_aplazatorias + 1,
            }
    await supabase.from('contratos').update(updates).eq('id', pagoCtx.contrato_id)
  }

  const vehiculo = contrato
    ? Array.isArray(contrato.vehiculos)
      ? contrato.vehiculos[0]
      : contrato.vehiculos
    : null

  if (conductor && contrato) {
    const semanaReportada =
      contrato.semanas_pagadas +
      (decision === 'verificado' && pagoCtx.tipo === 'canon' ? 1 : 0)

    // Avance del conductor hacia la opción de compra del vehículo.
    // Igual cálculo que muestra /conductor/dashboard: ahorro + bonos + abonos extras
    // sobre valor_comercial_acordado (no sobre total canon facturable).
    let abonado_compra: number | undefined
    let valor_vehiculo: number | undefined
    let porcentaje: number | undefined
    let usar_template_abono: boolean | undefined

    if (pagoCtx.tipo === 'canon') {
      const { data: contratoFresh } = await supabase
        .from('contratos')
        .select('valor_comercial_acordado, ahorro_acumulado, bonos_acumulados, abonos_extras_acumulados')
        .eq('id', pagoCtx.contrato_id)
        .single()
      if (contratoFresh) {
        abonado_compra =
          (contratoFresh.ahorro_acumulado ?? 0) +
          (contratoFresh.bonos_acumulados ?? 0) +
          (contratoFresh.abonos_extras_acumulados ?? 0)
        valor_vehiculo = contratoFresh.valor_comercial_acordado
        porcentaje = valor_vehiculo > 0 ? abonado_compra / valor_vehiculo : 0
      }
      // Mostrar tip de abono extra en hitos (cada 5 semanas) — sutilmente, no siempre
      usar_template_abono =
        decision === 'verificado' && semanaReportada > 0 && semanaReportada % 5 === 0
    }

    await notify({
      event: 'comprobante.resuelto',
      conductor_id: contrato.conductor_id,
      contrato_id: pagoCtx.contrato_id,
      nombre_conductor: conductor.nombre_completo,
      telefono_conductor: conductor.telefono,
      semana: semanaReportada,
      monto: pagoCtx.monto,
      tipo: pagoCtx.tipo,
      decision,
      motivo,
      abonado_compra,
      valor_vehiculo,
      porcentaje,
      usar_template_abono,
    })
  }

  if (decision === 'verificado' && conductor && contrato && vehiculo) {
    const { data: agg } = await supabase
      .from('pagos')
      .select('monto, multa_mora')
      .eq('contrato_id', pagoCtx.contrato_id)
      .eq('estado', 'verificado')
    const ingresoAcumulado = (agg ?? []).reduce((s, r) => s + (r.monto ?? 0), 0)
    const gastosAcumulado = (agg ?? []).reduce((s, r) => s + (r.multa_mora ?? 0), 0)

    const { data: contratoFull } = await supabase
      .from('contratos')
      .select('valor_comercial_acordado, semanas_pagadas')
      .eq('id', pagoCtx.contrato_id)
      .single()

    const rawUrl = pagoCtx.comprobante_url ?? ''
    const comprobantePath = rawUrl.startsWith('http')
      ? rawUrl.split('/comprobantes/')[1] ?? ''
      : rawUrl
    let comprobanteSignedUrl = rawUrl
    if (comprobantePath) {
      const { data: signed } = await supabase.storage
        .from('comprobantes')
        .createSignedUrl(comprobantePath, 60 * 60 * 24)
      if (signed?.signedUrl) comprobanteSignedUrl = signed.signedUrl
    }

    await archivarPago({
      contrato_id: pagoCtx.contrato_id,
      nombre_conductor: conductor.nombre_completo,
      cedula: conductor.cedula,
      placa: vehiculo.placa,
      semana: contrato.semanas_pagadas + (pagoCtx.tipo === 'canon' ? 1 : 0),
      tipo: pagoCtx.tipo,
      monto: pagoCtx.monto,
      dias_mora: pagoCtx.dias_mora ?? 0,
      multa_mora: pagoCtx.multa_mora ?? 0,
      fecha_pago: pagoCtx.fecha_pago,
      comprobante_url: comprobanteSignedUrl,
      aprobado_por: user.email ?? user.id,
      ingreso_acumulado: ingresoAcumulado,
      gastos_acumulado: gastosAcumulado,
      costo_vehiculo: contratoFull?.valor_comercial_acordado ?? 0,
      semanas_pagadas: contratoFull?.semanas_pagadas ?? 0,
    })
  }

  revalidatePath('/equipo/pagos')
  revalidatePath('/equipo/dashboard')
  return { success: true }
}
