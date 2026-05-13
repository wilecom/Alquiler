'use server'

import { createClient } from '@/lib/supabase/server'
import { notify } from '@/lib/notifications/whatsapp'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { hoyColombia } from '@/lib/date/colombia'

export type AbonoState = { error: string } | { success: string }

export async function subirAbonoExtra(args: {
  path: string
  monto: number
}): Promise<AbonoState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const monto = Math.floor(args.monto)
  if (!Number.isFinite(monto) || monto <= 0) {
    return { error: 'Monto inválido.' }
  }

  const { data: conductor } = await supabase
    .from('conductores')
    .select('id, nombre_completo, telefono')
    .eq('user_id', user.id)
    .single()
  if (!conductor) return { error: 'Perfil no encontrado.' }

  const { data: contrato } = await supabase
    .from('contratos')
    .select('id, valor_comercial_acordado, ahorro_acumulado, bonos_acumulados, abonos_extras_acumulados')
    .eq('conductor_id', conductor.id)
    .eq('estado', 'activo')
    .maybeSingle()
  if (!contrato) return { error: 'No tienes un contrato activo.' }

  if (!args.path || !args.path.startsWith(`${contrato.id}/`)) {
    return { error: 'Ruta de archivo inválida.' }
  }

  const restante =
    contrato.valor_comercial_acordado -
    (contrato.ahorro_acumulado + contrato.bonos_acumulados + contrato.abonos_extras_acumulados)
  if (restante <= 0) return { error: 'Tu contrato ya está completo.' }
  if (monto > restante) {
    return { error: `El monto supera el saldo restante (${restante.toLocaleString('es-CO')} COP).` }
  }

  const hoy = hoyColombia()

  const { error: pagoErr } = await supabase.from('pagos').insert({
    contrato_id: contrato.id,
    tipo: 'abono_extra',
    fecha_pago: hoy,
    fecha_vencimiento: hoy,
    monto,
    comprobante_url: args.path,
    estado: 'comprobante_subido',
  })
  if (pagoErr) return { error: 'Error al registrar el abono.' }

  const { data: signed } = await supabase.storage
    .from('comprobantes')
    .createSignedUrl(args.path, 60 * 60 * 24 * 7)

  after(() =>
    notify({
      event: 'comprobante.subido',
      conductor_id: conductor.id,
      contrato_id: contrato.id,
      nombre_conductor: conductor.nombre_completo,
      telefono_conductor: conductor.telefono,
      semana: 0,
      monto,
      comprobante_url: signed?.signedUrl ?? args.path,
      fecha_pago: hoy,
    }),
  )

  return { success: '¡Abono extra enviado! El equipo lo revisará pronto.' }
}
