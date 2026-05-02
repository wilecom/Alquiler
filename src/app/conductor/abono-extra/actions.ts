'use server'

import { createClient } from '@/lib/supabase/server'
import { notify } from '@/lib/notifications/whatsapp'
import { redirect } from 'next/navigation'
import { z } from 'zod'

export type AbonoState = { error: string } | { success: string } | null

const Schema = z.object({
  monto: z.coerce.number().int().positive({ error: 'El monto debe ser mayor a 0.' }),
})

export async function subirAbonoExtra(
  _prev: AbonoState,
  formData: FormData,
): Promise<AbonoState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const parsed = Schema.safeParse({ monto: formData.get('monto') })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Monto inválido.' }
  }
  const monto = parsed.data.monto

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

  const restante =
    contrato.valor_comercial_acordado -
    (contrato.ahorro_acumulado + contrato.bonos_acumulados + contrato.abonos_extras_acumulados)
  if (restante <= 0) return { error: 'Tu contrato ya está completo.' }
  if (monto > restante) {
    return { error: `El monto supera el saldo restante (${restante.toLocaleString('es-CO')} COP).` }
  }

  const file = formData.get('comprobante') as File
  if (!file || file.size === 0) {
    return { error: 'Selecciona el comprobante de pago.' }
  }
  if (file.size > 10 * 1024 * 1024) {
    return { error: 'El archivo no puede superar 10 MB.' }
  }
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowed.includes(file.type)) {
    return { error: 'Solo se aceptan imágenes (JPG, PNG, WEBP) o PDF.' }
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const fileName = `${contrato.id}/abono_${Date.now()}.${ext}`
  const buffer = await file.arrayBuffer()
  const { error: upErr } = await supabase.storage
    .from('comprobantes')
    .upload(fileName, buffer, { contentType: file.type, upsert: false })
  if (upErr) return { error: 'Error al subir el archivo.' }

  const hoy = new Date().toISOString().split('T')[0]

  const { error: pagoErr } = await supabase.from('pagos').insert({
    contrato_id: contrato.id,
    tipo: 'abono_extra',
    fecha_pago: hoy,
    fecha_vencimiento: hoy,
    monto,
    comprobante_url: fileName,
    estado: 'comprobante_subido',
  })
  if (pagoErr) return { error: 'Error al registrar el abono.' }

  const { data: signed } = await supabase.storage
    .from('comprobantes')
    .createSignedUrl(fileName, 60 * 60 * 24 * 7)

  await notify({
    event: 'comprobante.subido',
    conductor_id: conductor.id,
    contrato_id: contrato.id,
    nombre_conductor: conductor.nombre_completo,
    telefono_conductor: conductor.telefono,
    semana: 0,
    monto,
    comprobante_url: signed?.signedUrl ?? fileName,
    fecha_pago: hoy,
  })

  return { success: '¡Abono extra enviado! El equipo lo revisará pronto.' }
}
